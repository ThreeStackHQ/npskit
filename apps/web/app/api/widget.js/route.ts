import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { CORS_HEADERS } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const widgetPath = join(
      process.cwd(),
      "..",
      "..",
      "packages",
      "widget",
      "dist",
      "widget.js"
    );
    const content = readFileSync(widgetPath, "utf-8");
    return new NextResponse(content, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (_err) {
    return new NextResponse("// Widget not built yet", {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/javascript",
      },
    });
  }
}
