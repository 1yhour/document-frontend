import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ForbiddenAlert from "@/components/ForbiddenAlert";

const inter = Inter({
  variable: "--font-inter",
  display: 'swap',
  preload: true,
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocuConvert - Document Conversion Platform",
  description: "Secure and role-aware document conversion platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <ForbiddenAlert />
        </AuthProvider>
      </body>
    </html>
  );
}
