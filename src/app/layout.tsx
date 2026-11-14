import type { Metadata } from "next";
import { Sarabun, Prompt } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NPC Admission | ระบบรับสมัครนักเรียน นักศึกษาใหม่ วิทยาลัยสารพัดช่างน่าน",
  description: "ระบบรับสมัครนักเรียน นักศึกษาใหม่ ระดับ ปวช. และ ปวส. วิทยาลัยสารพัดช่างน่าน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${sarabun.variable} ${prompt.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans bg-slate-50 text-slate-800 flex flex-col">
        {children}
      </body>
    </html>
  );
}
