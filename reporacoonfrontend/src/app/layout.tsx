import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";


// TODO: Insert header and styling here when we do the frontend
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
