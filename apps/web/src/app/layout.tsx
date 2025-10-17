import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/app/shared/ThemeProvider";
import Header from "@/components/app/shared/Header";
import Footer from "@/components/app/shared/Footer";

export const metadata: Metadata = {
  title: "Unsigned Keyboard",
  description: "Write Indian languages online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        <div className="texture-overlay"></div>
        <ThemeProvider>
          <Header />
          <main className="flex-grow relative z-10">{children}</main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
