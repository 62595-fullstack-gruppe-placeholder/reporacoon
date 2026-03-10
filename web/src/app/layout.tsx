import { Inter } from "next/font/google";
import "./globals.css";
import { getUser } from "@/lib/auth/userFromToken";
import Header from "./_components/Header";
import { Metadata } from "next";

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
      <body className={`antialiased`}>
        <Header user={user}/>
        {children}
      </body>
    </html>
  );
}
