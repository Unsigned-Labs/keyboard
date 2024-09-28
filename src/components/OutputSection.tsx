import React from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    <div className="relative bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md">
      <div className="p-4 min-h-[16rem] text-xl text-gray-900 dark:text-gray-100">
        {output}
      </div>
      <Button
        onClick={copyToClipboard}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default OutputSection;
