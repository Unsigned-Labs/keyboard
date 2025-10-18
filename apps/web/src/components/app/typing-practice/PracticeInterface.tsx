"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { VirtualKeyboard } from "@/components/app/typing-practice/VirtualKeyboard";
import { TypingArea } from "@/components/app/typing-practice/TypingArea";
import { PracticeLevel } from "@/utils/typingPracticeLevels";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";

interface PracticeInterfaceProps {
  currentLevel: PracticeLevel | null;
  isStarted: boolean;
  timer: number;
  accuracy: number;
  userInput: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  characterStates: ("correct" | "incorrect" | "pending")[];
  isCompleted: boolean;
  finalScore: { accuracy: number; time: number };
  onStart: () => void;
  onReset: () => void;
  onTryAgain: () => void;
  onPreviousLevel: () => void;
  onNextLevel: () => void;
  hasPreviousLevel: boolean;
  hasNextLevel: boolean;
  nextKey: string;
}

const PracticeInterface: React.FC<PracticeInterfaceProps> = ({
  currentLevel,
  isStarted,
  timer,
  accuracy,
  userInput,
  onInputChange,
  characterStates,
  isCompleted,
  finalScore,
  onStart,
  onReset,
  onTryAgain,
  onPreviousLevel,
  onNextLevel,
  hasPreviousLevel,
  hasNextLevel,
  nextKey,
}) => {
  if (!currentLevel) return null;

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-3xl mb-4 text-gray-900 dark:text-gray-100">Level {currentLevel.level}</h2>
      <p className="mb-6 text-xl text-gray-700 dark:text-gray-300">{currentLevel.text}</p>
      {!isStarted && (
        <Button
          onClick={onStart}
          className="bg-green-500 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-800 transition-colors"
        >
          Start Practice
        </Button>
      )}
      {isStarted && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">Time: {timer}s</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Accuracy: {accuracy.toFixed(2)}%
            </span>
          </div>
          {isCompleted ? (
            <div className="mb-6 text-center">
              <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Practice Completed!</h3>
              <p className="text-xl text-gray-700 dark:text-gray-300">Time: {finalScore.time}s</p>
              <p className="text-xl text-gray-700 dark:text-gray-300">
                Accuracy: {finalScore.accuracy.toFixed(2)}%
              </p>
              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  onClick={onTryAgain}
                  className="bg-green-500 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-800 transition-colors"
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                {hasPreviousLevel && (
                  <Button
                    onClick={onPreviousLevel}
                    className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous Level
                  </Button>
                )}
                {hasNextLevel && (
                  <Button
                    onClick={onNextLevel}
                    className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                  >
                    Next Level
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <TypingArea
              targetText={currentLevel.text}
              userInput={userInput}
              onChange={onInputChange}
              characterStates={characterStates}
              isCompleted={isCompleted}
            />
          )}
          <VirtualKeyboard highlightKey={nextKey} />
        </>
      )}
    </div>
  );
};

export default PracticeInterface;