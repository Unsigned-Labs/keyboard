"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PracticeLevel } from "@/utils/typingPracticeLevels";

interface LevelSelectorProps {
  levels: PracticeLevel[];
  onLevelSelect: (index: number) => void;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ levels, onLevelSelect }) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {levels.map((level, index) => (
        <Button
          key={level.level}
          onClick={() => onLevelSelect(index)}
          className="aspect-square flex items-center justify-center text-2xl font-bold bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          style={{ height: "100px" }}
        >
          {level.level}
        </Button>
      ))}
    </div>
  );
};

export default LevelSelector;