import React from "react";

interface VirtualKeyboardProps {
  highlightKey: string;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ highlightKey }) => {
  const rows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];

  return (
    <div className="mt-6">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center mb-2">
          {row.map((key) => (
            <div
              key={key}
              className={`
                w-12 h-12 m-1 flex items-center justify-center rounded-md font-geist-mono text-lg
                ${
                  key === highlightKey.toLowerCase()
                    ? "bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 shadow-md"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                }
                transition-all duration-200 ease-in-out
              `}
            >
              {key}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
