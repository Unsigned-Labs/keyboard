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
      const virtualPos = getVirtualCursorPosition();
      return (
        <>
          {transliteratedOutput.slice(0, virtualPos)}
          <span className={`${showCursor ? "opacity-100" : "opacity-0"} transition-opacity duration-100 text-purple`}>|</span>
          {transliteratedOutput.slice(virtualPos)}
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
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple via-purple-dark to-purple rounded-2xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity duration-500 pointer-events-none"></div>

        {/* Main input area */}
        <div className="relative bg-gradient-to-br from-card to-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden min-h-[420px]">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-transparent pointer-events-none"></div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={onChange}
            className="absolute inset-0 w-full h-full p-6 text-xl bg-transparent resize-none outline-none opacity-0 z-10"
            style={{ caretColor: "transparent" }}
            placeholder="Start typing..."
          />
          <div
            ref={transliteratedRef}
            className="relative p-6 text-xl text-foreground pointer-events-none whitespace-pre-wrap overflow-auto min-h-[420px] font-light leading-relaxed"
            style={{ wordWrap: "break-word" }}
          >
            {transliteratedOutput ? (
              renderTransliteratedOutput()
            ) : (
              <span className="text-muted-foreground/50 italic">
                Start typing to see transliteration...
                <span className={`ml-1 text-purple ${showCursor ? "opacity-100" : "opacity-0"} transition-opacity duration-100`}>|</span>
              </span>
            )}
          </div>
          <div className="absolute bottom-3 right-3 z-20">
            <CopyButton
              onClick={() => {
                const selected = selectionRange ? transliteratedOutput.slice(selectionRange.start, selectionRange.end) : transliteratedOutput;
                navigator.clipboard.writeText(selected || "");
                const previewText = (selected || transliteratedOutput).length > 50 ? `${(selected || transliteratedOutput).slice(0, 50)}...` : (selected || transliteratedOutput);
                toast({
                  title: "Text copied",
                  description: previewText,
                });
              }}
              showText={false}
            />
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default InputSection;
