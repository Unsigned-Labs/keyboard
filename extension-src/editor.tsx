import React from "react";
import "@/app/globals.css";
import { createRoot } from "react-dom/client";
import Home from "@/app/page";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-5 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white hover:text-orange-300 dark:hover:text-purple-300 transition-colors">
            অসমীয়া কিব’ৰ্ড
          </h1>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            by <span className="font-semibold">Unsigned</span>
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
};

const Editor: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Home />
        </main>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <Editor />
  </React.StrictMode>
);
