import React from "react";
import { useToast } from "@/hooks/use-toast";
import CopyButton from "./CopyButton";

interface OutputSectionProps {
  output: string;
}

const OutputSection: React.FC<OutputSectionProps> = ({ output }) => {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast({
      title: "Text copied",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md overflow-auto">
        <div className="p-4 text-lg text-gray-900 dark:text-gray-100 h-full">
          {output}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <CopyButton onClick={copyToClipboard} />
      </div>
    </div>
  );
};

export default OutputSection;
