import React from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface CopyButtonProps {
  onClick: () => void;
  showText?: boolean;
}
const CopyButton: React.FC<CopyButtonProps> = ({ onClick, showText = false }) => {
  return (
    <Button
      onClick={onClick}
      aria-label="Copy transliterated text"
      className="inline-flex items-center justify-center gap-2 bg-purple/10 hover:bg-purple/20 text-purple border border-purple/30 hover:border-purple/50 px-3 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple/20 backdrop-blur-sm"
    >
      <Copy className="h-4 w-4" />
      {showText && <span className="font-medium">Copy</span>}
    </Button>
  );
};

export default CopyButton;
