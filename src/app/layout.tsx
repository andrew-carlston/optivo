import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Optivo",
  description: "WFM/HR SaaS Platform",
};

// Blocking script that runs before paint to prevent theme/expand flash
const RESTORE_SCRIPT = `(function(){try{
var t=localStorage.getItem("optivo-theme");
var m=localStorage.getItem("optivo-mode");
var e=localStorage.getItem("optivo-expanded");
var d=document.documentElement;
if(t)d.setAttribute("data-theme",t);
if(m){var r=m==="system"?(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"):m;d.setAttribute("data-mode",r)}
if(e==="true")d.classList.add("expanded");
}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="default" data-mode="light" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: RESTORE_SCRIPT }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
