import React from "react";
import { Button } from "@/components/ui/button";

interface InputSectionProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  clearInput: () => void;
}

const InputSection: React.FC<InputSectionProps> = ({
  input,
  onChange,
  clearInput,
}) => {
  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={onChange}
        placeholder="Type in English"
        className="w-full h-64 p-4 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
      <div className="flex justify-end">
        <Button onClick={clearInput} variant="outline" size="sm">
          Clear
        </Button>
      </div>
    </div>
  );
};

export default InputSection;
