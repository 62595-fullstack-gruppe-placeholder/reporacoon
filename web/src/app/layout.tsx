import { Inter } from "next/font/google";
import "./globals.css";
import { getUser } from "@/lib/auth/userFromToken";
import Header from "./_components/Header";
import { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Repo Racoon",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  return (
    <html lang="en" className={inter.variable}>
      <body className={`antialiased`} data-testid="body">
        <Header user={user}/>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
