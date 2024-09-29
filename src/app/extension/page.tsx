"use client";

import React, { useState } from "react";
import Head from "next/head";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Info, TestTube } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TestTabContent: React.FC = () => {
  return (
    <div className="space-y-6">
      <p className="text-gray-700 dark:text-gray-300">
        This is a simple test page to test the functionality of the browser extension. 
        Make sure the extension is installed and enabled.
      </p>
      <Card className="bg-gray-50 dark:bg-gray-700 mt-6">
        <CardContent className="space-y-4 p-6">
          <div>
            <label htmlFor="single-line" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Single Line Input:
            </label>
            <input
              type="text"
              id="single-line"
              placeholder="Type here..."
              className="w-full p-2 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
            />
          </div>
          <div>
            <label htmlFor="multi-line" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Multi-line Input:
            </label>
            <textarea
              id="multi-line"
              rows={4}
              placeholder="Type here..."
              className="w-full p-2 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="contenteditable" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Contenteditable Div:
            </label>
            <div
              id="contenteditable"
              className="border rounded p-2 min-h-[100px] bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
              contentEditable
              suppressContentEditableWarning
            >
              Type here...
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ExtensionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("info");

  const detectBrowser = () => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.indexOf("firefox") > -1) return "firefox";
      if (userAgent.indexOf("chrome") > -1 || userAgent.indexOf("chromium") > -1) return "chrome";
    }
    return "unknown";
  };

  const browser = detectBrowser();

  const getInstructions = () => {
    const instructions = browser === "firefox"
      ? [
          "Download the extension ZIP file using the button below.",
          "Unzip the downloaded file to a location on your computer.",
          "Open Firefox and navigate to about:debugging.",
          'Click "This Firefox" in the left sidebar.',
          'Click "Load Temporary Add-on..."',
          "Navigate to the unzipped folder and select the manifest.json file.",
          "The extension should now be installed and ready to use!",
        ]
      : [
          "Download the extension ZIP file using the button below.",
          "Unzip the downloaded file to a location on your computer.",
          "Open Chrome and navigate to chrome://extensions.",
          'Enable "Developer mode" using the toggle in the top right corner.',
          'Click "Load unpacked" in the top left corner.',
          "Navigate to and select the unzipped folder.",
          "The extension should now be installed and ready to use!",
        ];

    return (
      <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
        {instructions.map((instruction, index) => (
          <li key={index}>{instruction}</li>
        ))}
      </ol>
    );
  };

  return (
    <>
      <Head>
        <title>Browser Extension - অসমীয়া কিব’ৰ্ড</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          Browser Extension
        </h1>
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="info" className="flex items-center justify-center">
                  <Info className="w-4 h-4 mr-2" />
                  Extension Info
                </TabsTrigger>
                <TabsTrigger value="test" className="flex items-center justify-center">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Page
                </TabsTrigger>
              </TabsList>
              <TabsContent value="info">
                <div className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    Enhance your experience with our browser extension for easier typing in Assamese. 
                    Follow the instructions below to install the extension in developer mode.
                  </p>
                  <div className="flex justify-center mt-6">
                    <a
                      href={browser === "firefox" ? "/extension-firefox.zip" : "/extension-chrome.zip"}
                      className={`inline-flex items-center gap-2 px-6 py-3 text-white rounded transition-colors ${
                        browser === "firefox" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      <Download className="h-5 w-5" />
                      Download for {browser === "firefox" ? "Firefox" : "Chrome"}
                    </a>
                  </div>
                  <Card className="bg-gray-50 dark:bg-gray-700 mt-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-gray-900 dark:text-gray-100">
                        Installation Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{getInstructions()}</CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="test">
                <TestTabContent />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ExtensionPage;