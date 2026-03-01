import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NPSKit — NPS & CSAT Surveys",
  description: "Dead-simple NPS & CSAT survey tool. Delighted alternative at $9/mo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
