import React from "react";
import ClearButton from "./ClearButton";

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
    <div className="flex flex-col h-full">
      <div className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md overflow-hidden flex flex-col">
        <textarea
          value={input}
          onChange={onChange}
          placeholder="Type in English"
          className="flex-grow w-full p-4 text-lg focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 resize-none"
        />
      </div>
      <div className="mt-4 flex justify-end">
        <ClearButton onClick={clearInput} />
      </div>
    </div>
  );
};

export default InputSection;
