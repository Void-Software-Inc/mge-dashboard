import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/global/Navbar";
import { createClient } from "@/utils/supabase/server";
import { AppProvider } from "@/app/context/AppContext";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "MGE Dashboard",
  description: "MGE Dashboard",
};

export async function displayContent() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    return false
  }
  return true
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <AppProvider>
          {await displayContent() && 
          <>
            <Navbar />
          </>
          }
          <section>
            {children}
          </section>
        </AppProvider>
      </body>
    </html>
  );
}
