"use client";

import React, { useState, useEffect, useCallback } from "react";
import { transliterate } from "@/utils/transliteration";
import { assameseSchema } from "@/utils/assameseSchema";
import { Button } from "@/components/ui/button";
import { VirtualKeyboard } from "@/components/typing-practice/VirtualKeyboard";
import { TypingArea } from "@/components/typing-practice/TypingArea";
import { TransliterationSchema } from "@/types/transliteration";
import { PracticeLevel, getPracticeLevels } from "@/utils/typingPracticeLevels";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";

const TypingPractice: React.FC = () => {
  const [levels, setLevels] = useState<PracticeLevel[]>([]);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [accuracy, setAccuracy] = useState(100);
  const [nextKey, setNextKey] = useState("");
  const [characterStates, setCharacterStates] = useState<("correct" | "incorrect" | "pending")[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState({ accuracy: 0, time: 0 });

  useEffect(() => {
    setLevels(getPracticeLevels());
  }, []);

  const currentLevel = currentLevelIndex !== null ? levels[currentLevelIndex] : null;

  const findEnglishKey = useCallback((char: string, schema: TransliterationSchema): string => {
    for (const [category, mapping] of Object.entries(schema)) {
      if (category === "exceptions") continue;
      for (const [englishChar, assameseChars] of Object.entries(mapping as Record<string, string[]>)) {
        if (assameseChars.includes(char)) {
          return englishChar;
        }
      }
    }
    return "";
  }, []);

  const updateNextKey = useCallback(
    (input: string) => {
      if (currentLevel && input.length < currentLevel.text.length) {
        const nextChar = currentLevel.text[input.length];
        const englishKey = findEnglishKey(nextChar, assameseSchema);
        setNextKey(englishKey);
      } else {
        setNextKey("");
      }
    },
    [currentLevel, findEnglishKey]
  );

  const startTimer = useCallback(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer + 1);
    }, 1000);
    setTimerInterval(interval);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [timerInterval]);

  const handleStart = useCallback(() => {
    setIsStarted(true);
    setUserInput("");
    setTimer(0);
    setAccuracy(100);
    setIsCompleted(false);
    updateNextKey("");
    if (currentLevel) {
      setCharacterStates(new Array(currentLevel.text.length).fill("pending"));
    }
    startTimer();
  }, [currentLevel, updateNextKey, startTimer]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      if (currentLevel) {
        setUserInput(input);

        const transliteratedInput = transliterate(input, assameseSchema);
        const targetText = currentLevel.text;

        let correct = 0;
        const newCharacterStates = [...characterStates];
        const minLength = Math.min(transliteratedInput.length, targetText.length);

        for (let i = 0; i < minLength; i++) {
          if (transliteratedInput[i] === targetText[i]) {
            correct++;
            newCharacterStates[i] = "correct";
          } else {
            newCharacterStates[i] = "incorrect";
          }
        }

        for (let i = minLength; i < targetText.length; i++) {
          newCharacterStates[i] = "pending";
        }

        setCharacterStates(newCharacterStates);

        const newAccuracy = transliteratedInput.length > 0 ? (correct / transliteratedInput.length) * 100 : 100;
        setAccuracy(newAccuracy);

        updateNextKey(transliteratedInput);

        if (transliteratedInput === targetText) {
          setIsCompleted(true);
          setFinalScore({ accuracy: newAccuracy, time: timer });
          stopTimer();
        }
      }
    },
    [currentLevel, updateNextKey, characterStates, timer, stopTimer]
  );

  const handleReset = useCallback(() => {
    setCurrentLevelIndex(null);
    setIsStarted(false);
    setUserInput("");
    setTimer(0);
    setAccuracy(100);
    setNextKey("");
    setCharacterStates([]);
    setIsCompleted(false);
    setFinalScore({ accuracy: 0, time: 0 });
    stopTimer();
  }, [stopTimer]);

  const goToNextLevel = useCallback(() => {
    if (currentLevelIndex !== null && currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex((prevIndex) => prevIndex! + 1);
      handleStart();
    }
  }, [currentLevelIndex, levels.length, handleStart]);

  const goToPreviousLevel = useCallback(() => {
    if (currentLevelIndex !== null && currentLevelIndex > 0) {
      setCurrentLevelIndex((prevIndex) => prevIndex! - 1);
      handleStart();
    }
  }, [currentLevelIndex, handleStart]);

  return (
    <div className="container mx-auto p-4 max-w-4xl relative font-geist-sans">
      {currentLevel && (
        <Button
          onClick={handleReset}
          className="absolute top-4 left-4 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Levels
        </Button>
      )}
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">অসমীয়া Typing Practice</h1>

      {currentLevelIndex === null && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {levels.map((level, index) => (
            <Button
              key={level.level}
              onClick={() => {
                setCurrentLevelIndex(index);
                setIsStarted(false);
              }}
              className="aspect-square flex items-center justify-center text-2xl font-bold bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              style={{ height: "100px" }}
            >
              {level.level}
            </Button>
          ))}
        </div>
      )}

      {currentLevel && (
        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-3xl mb-4 text-gray-900 dark:text-gray-100">Level {currentLevel.level}</h2>
          <p className="mb-6 text-xl text-gray-700 dark:text-gray-300">{currentLevel.text}</p>
          {!isStarted && (
            <Button
              onClick={handleStart}
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
                      onClick={handleStart}
                      className="bg-green-500 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-800 transition-colors"
                    >
                      <RotateCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    {currentLevelIndex! > 0 && (
                      <Button
                        onClick={goToPreviousLevel}
                        className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous Level
                      </Button>
                    )}
                    {currentLevelIndex! < levels.length - 1 && (
                      <Button
                        onClick={goToNextLevel}
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
                  onChange={handleInputChange}
                  characterStates={characterStates}
                  isCompleted={isCompleted}
                />
              )}
              <VirtualKeyboard highlightKey={nextKey} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TypingPractice;
