import React from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface CopyButtonProps {
  onClick: () => void;
}
const CopyButton: React.FC<CopyButtonProps> = ({ onClick }) => {
  return (
    <div className="flex justify-end">
      <Button
        onClick={onClick}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2 border-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-400 dark:hover:bg-gray-950 dark:hover:text-gray-300 transition-colors duration-200"
      >
        <Copy className="h-4 w-4" />
        <span>Copy</span>
      </Button>
    </div>
  );
};

export default CopyButton;
