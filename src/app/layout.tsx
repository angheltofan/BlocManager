import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlockManager",
  description: "Platformă SaaS cu abonament pentru administrarea asociațiilor de proprietari",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
