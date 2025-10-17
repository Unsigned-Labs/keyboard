import React from "react";

interface TypingAreaProps {
  targetText: string;
  userInput: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  characterStates: ("correct" | "incorrect" | "pending")[];
  isCompleted: boolean;
}

export const TypingArea: React.FC<TypingAreaProps> = ({
  targetText,
  userInput,
  onChange,
  characterStates,
  isCompleted,
}) => {
  return (
    <div className="mb-6">
      <div className="text-2xl mb-4 font-geist-mono leading-relaxed">
        {targetText.split("").map((char, index) => (
          <span
            key={index}
            className={`
              ${characterStates[index] === "correct" ? "text-green-500 dark:text-green-400" : ""}
              ${characterStates[index] === "incorrect" ? "text-red-500 dark:text-red-400" : ""}
              ${characterStates[index] === "pending" ? "text-gray-400 dark:text-gray-500" : ""}
            `}
          >
            {char}
          </span>
        ))}
      </div>
      <input
        type="text"
        value={userInput}
        onChange={onChange}
        className="w-full p-3 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 ease-in-out font-geist-mono text-lg"
        autoFocus
        disabled={isCompleted}
      />
    </div>
  );
};
