import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, users, workspaces, subscriptions, eq } from "@npskit/db";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

export const dynamic = "force-dynamic";

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(100).optional(),
  workspaceName: z.string().min(1).max(100).optional(),
});

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password, name, workspaceName } = parsed.data;

    // Check if user already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, name: name ?? null })
      .returning({ id: users.id });

    if (!user) {
      throw new Error("Failed to create user");
    }

    // Create default workspace
    const wsName = workspaceName ?? (name ? `${name}'s Workspace` : "My Workspace");
    let slug = slugify(wsName);

    // Ensure slug uniqueness
    const existingSlug = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);

    if (existingSlug.length > 0) {
      slug = `${slug}-${createId().slice(0, 6)}`;
    }

    const [workspace] = await db
      .insert(workspaces)
      .values({ name: wsName, slug, ownerId: user.id })
      .returning({ id: workspaces.id });

    if (!workspace) {
      throw new Error("Failed to create workspace");
    }

    // Create free subscription
    await db.insert(subscriptions).values({
      workspaceId: workspace.id,
      tier: "free",
      status: "active",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
