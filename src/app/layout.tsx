import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 需求雷达 | Need Radar",
  description: "帮独立开发者从全网噪音中自动发现值得做的产品机会",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
        {children}
      </body>
    </html>
  );
}
