import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardSidebar email={session.user?.email}>
      {children}
    </DashboardSidebar>
  );
}
