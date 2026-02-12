import { Inter } from "next/font/google";
import "./globals.css";
import Image from 'next/image'

// The inter font type
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", 
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>

      <body
        className={`antialiased`}
      >
        <header>
          <div className="self-stretch px-10 py-3 border-b border-box flex w-full justify-between items-center">
            <div className="flex justify-start items-center gap-4">
              <Image src="/logo.png" alt="logo" width="32" height="32"></Image>
              <p className="text-main-text">Repo Racoon</p>
            </div>
            <div className="self-stretch h-10 inline-flex justify-end items-center gap-8">
              <p className="text-center justify-center">Features</p>
              <button className="bg-button-main btn">Sign up</button>
              <button className="bg-box px-5 btn">Log in</button>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}