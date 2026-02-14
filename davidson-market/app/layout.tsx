import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wildcat Market",
  description: "The trusted marketplace for Davidson College.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen w-screen overflow-hidden bg-gray-50 relative`}
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="/asddf.png"
            alt="Background"
            fill
            priority
            quality={100}
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-[#f6f1e8]/90" />
        </div>

        <div className="relative z-10 h-full flex flex-col">
          <Navbar />
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children}
          </main>
        </div>
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
