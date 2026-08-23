import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "../components/ClientProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FoxxNuts — AI Knowledge Infrastructure",
  description:
    "Turn your business knowledge into an AI assistant. Upload documents, configure your chatbot, and embed it anywhere.",
  keywords: ["AI", "chatbot", "RAG", "knowledge base", "SaaS"],
  icons: {
    icon: "/dark_without_text-removebg-preview.png",
    shortcut: "/dark_without_text-removebg-preview.png",
    apple: "/dark_without_text-removebg-preview.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="icon"
          href="/dark_without_text-removebg-preview.png"
          type="image/png"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fn-theme');if(t==='light'){document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
