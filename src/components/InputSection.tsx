import React, { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import CopyButton from "./CopyButton";

interface InputSectionProps {
  input: string;
  transliteratedOutput: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onInputChange: (newInput: string) => void;
}

const InputSection: React.FC<InputSectionProps> = ({ input, transliteratedOutput, onChange, onInputChange }) => {
  const { toast } = useToast();
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transliteratedRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = useCallback(() => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      setCursorPosition(start);
      if (start !== end) {
        setSelectionRange({ start, end });
      } else {
        setSelectionRange(null);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(intervalId);
  }, []);

  const getVirtualCursorPosition = useCallback(() => {
    let virtualPos = 0;
    for (let i = 0; i < cursorPosition && virtualPos < transliteratedOutput.length; i++) {
      virtualPos++;
    }
    return virtualPos;
  }, [cursorPosition, transliteratedOutput]);

  const handleCopyOrCut = useCallback(
    (e: ClipboardEvent) => {
      if (selectionRange) {
        e.preventDefault();
        const selectedText = transliteratedOutput.slice(selectionRange.start, selectionRange.end);
        navigator.clipboard.writeText(selectedText);

        const previewText = selectedText.length > 50 ? `${selectedText.slice(0, 50)}...` : selectedText;

        toast({
          title: e.type === "copy" ? "Text copied" : "Text cut",
          description: previewText,
        });

        if (e.type === "cut") {
          const newInput = input.slice(0, selectionRange.start) + input.slice(selectionRange.end);
          onInputChange(newInput);
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(selectionRange.start, selectionRange.start);
          }
        }
      }
    },
    [input, transliteratedOutput, selectionRange, toast, onInputChange]
  );

  useEffect(() => {
    document.addEventListener("copy", handleCopyOrCut);
    document.addEventListener("cut", handleCopyOrCut);
    return () => {
      document.removeEventListener("copy", handleCopyOrCut);
      document.removeEventListener("cut", handleCopyOrCut);
    };
  }, [handleCopyOrCut]);

  const renderTransliteratedOutput = () => {
    if (!selectionRange) {
      return (
        <>
          {transliteratedOutput.slice(0, getVirtualCursorPosition())}
          <span className={`${showCursor ? "opacity-100" : "opacity-0"} transition-opacity duration-100`}>|</span>
          {transliteratedOutput.slice(getVirtualCursorPosition())}
        </>
      );
    }

    return (
      <>
        {transliteratedOutput.slice(0, selectionRange.start)}
        <span className="bg-blue-200 dark:bg-blue-800">
          {transliteratedOutput.slice(selectionRange.start, selectionRange.end)}
        </span>
        {transliteratedOutput.slice(selectionRange.end)}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md overflow-hidden relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onChange}
          className="absolute inset-0 w-full h-full p-4 text-lg bg-transparent resize-none outline-none opacity-0"
          style={{ caretColor: "transparent" }}
        />
        <div
          ref={transliteratedRef}
          className="absolute inset-0 p-4 text-lg text-gray-900 dark:text-gray-100 pointer-events-none whitespace-pre-wrap overflow-hidden"
          style={{ wordWrap: "break-word" }}
        >
          {renderTransliteratedOutput()}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <CopyButton onClick={() => navigator.clipboard.writeText(transliteratedOutput)} />
      </div>
    </div>
  );
};

export default InputSection;
