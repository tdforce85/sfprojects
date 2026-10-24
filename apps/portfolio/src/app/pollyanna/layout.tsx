import type { Metadata } from "next";
import { Mountains_of_Christmas } from "next/font/google";
import "./pollyanna.css";

const display = Mountains_of_Christmas({
  weight: ["700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pollyanna-display",
});

export const metadata: Metadata = {
  title: "Pollyanna 🎁",
  robots: { index: false, follow: false },
  openGraph: {
    title: "You've got a Pollyanna! 🎁",
    description: "Tap to unwrap who you're getting a gift for.",
  },
};

export default function PollyannaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${display.variable} pollyanna-root`}>{children}</div>
  );
}
