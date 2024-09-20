"use client"

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Copy } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { transliterate } from "@/utils/transliteration";
import { updateSuggestions } from "@/utils/suggestions";
import SchemaManager from "@/components/SchemaManager";
import { TransliterationScheme } from "@/types/transliteration";
import { assameseScheme } from "@/data/assameseScheme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UnsignedKeyboard: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { theme, toggleTheme } = useTheme();
  const [currentSchema, setCurrentSchema] = useState<TransliterationScheme>(assameseScheme);
  const [schemas, setSchemas] = useState<TransliterationScheme[]>([assameseScheme]);

  useEffect(() => {
    const savedSchemas = localStorage.getItem("transliterationSchemas");
    if (savedSchemas) {
      setSchemas(JSON.parse(savedSchemas));
    }
  }, []);

  const updateOutput = useCallback(() => {
    setOutput(transliterate(input, currentSchema));
  }, [input, currentSchema]);

  useEffect(() => {
    updateOutput();
  }, [updateOutput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    setInput(newInput);
    const newSuggestions = updateSuggestions(newInput, currentSchema);
    setSuggestions(newSuggestions);
  };

  const clearInput = () => {
    setInput("");
    setSuggestions([]);
  };

  const applySuggestion = (word: string) => {
    setInput(word);
    setSuggestions([]);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    // Optionally, you can add a toast notification here
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Unsigned Assamese Keyboard</h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      <Tabs defaultValue="keyboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="keyboard">Keyboard</TabsTrigger>
          <TabsTrigger value="schema">Schema Manager</TabsTrigger>
        </TabsList>
        <TabsContent value="keyboard">
          <div className="space-y-4 mt-4">
            <Select
              value={currentSchema.name}
              onValueChange={(value) => {
                const schema = schemas.find((s) => s.name === value);
                if (schema) {
                  setCurrentSchema(schema);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a schema" />
              </SelectTrigger>
              <SelectContent>
                {schemas.map((schema) => (
                  <SelectItem key={schema.name} value={schema.name}>
                    {schema.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type in English"
              className="w-full"
            />

            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((word, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applySuggestion(word)}
                  >
                    {word}
                  </Button>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-4 rounded min-h-[100px] text-xl text-gray-900 dark:text-gray-100">
                {output}
              </div>
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-end">
              <Button onClick={clearInput} variant="outline" size="sm">
                Clear
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="schema">
          <SchemaManager onSchemaChange={setCurrentSchema} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnsignedKeyboard;
