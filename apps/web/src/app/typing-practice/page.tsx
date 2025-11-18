"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTransliterator, TransliterationSchema } from "@/hooks/useTransliterator";
import { Button } from "@/components/ui/button";
import LevelSelector from "@/components/app/typing-practice/LevelSelector";
import PracticeInterface from "@/components/app/typing-practice/PracticeInterface";
import { PracticeLevel, getPracticeLevels } from "@/utils/typingPracticeLevels";
import { ArrowLeft } from "lucide-react";

const TypingPractice: React.FC = () => {
  const { wasmReady, schemas, transliterate } = useTransliterator();
  const [selectedLanguage, setSelectedLanguage] = useState("as");
  const [levels, setLevels] = useState<PracticeLevel[]>([]);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const languages = [
    { code: "as", name: "Assamese", enabled: true },
    { code: "bn", name: "Bangla", enabled: false, comingSoon: true },
    { code: "hi", name: "Hindi", enabled: false, comingSoon: true },
  ];
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
      if (currentLevel && input.length < currentLevel.text.length && schemas.assamese) {
        const nextChar = currentLevel.text[input.length];
        const englishKey = findEnglishKey(nextChar, schemas.assamese);
        setNextKey(englishKey);
      } else {
        setNextKey("");
      }
    },
    [currentLevel, findEnglishKey, schemas.assamese]
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
      if (currentLevel && schemas.assamese) {
        setUserInput(input);

        const transliteratedInput = transliterate(input, schemas.assamese);
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
    [currentLevel, updateNextKey, characterStates, timer, stopTimer, transliterate, schemas.assamese]
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

  if (!wasmReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transliterator...</p>
        </div>
      </div>
    );
  }

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
      <h1 className="text-4xl font-bold mb-4 text-center text-gray-900 dark:text-gray-100">Typing Practice</h1>

      {/* Language Picker */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2">Language:</span>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => lang.enabled && setSelectedLanguage(lang.code)}
              disabled={!lang.enabled}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedLanguage === lang.code
                  ? "bg-blue-600 text-white shadow-sm"
                  : lang.enabled
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  : "bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
            >
              {lang.name}
              {lang.comingSoon && (
                <span className="ml-1 text-xs">(Soon)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {currentLevelIndex === null ? (
        <LevelSelector levels={levels} onLevelSelect={(index) => {
          setCurrentLevelIndex(index);
          setIsStarted(false);
        }} />
      ) : (
        <PracticeInterface
          currentLevel={currentLevel}
          isStarted={isStarted}
          timer={timer}
          accuracy={accuracy}
          userInput={userInput}
          onInputChange={handleInputChange}
          characterStates={characterStates}
          isCompleted={isCompleted}
          finalScore={finalScore}
          onStart={handleStart}
          onReset={handleReset}
          onTryAgain={handleStart}
          onPreviousLevel={goToPreviousLevel}
          onNextLevel={goToNextLevel}
          hasPreviousLevel={currentLevelIndex !== null && currentLevelIndex > 0}
          hasNextLevel={currentLevelIndex !== null && currentLevelIndex < levels.length - 1}
          nextKey={nextKey}
        />
      )}
    </div>
  );
};

export default TypingPractice;
