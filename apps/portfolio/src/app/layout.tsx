import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tony DeGregorio | Salesforce Architect",
  description:
    "Senior Salesforce Architect specializing in Agentforce, Flow, and enterprise platform design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={spaceGrotesk.className}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
