import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ClearButtonProps {
  onClick: () => void;
}

const ClearButton: React.FC<ClearButtonProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className="flex items-center space-x-2 text-red-500 border-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 transition-colors duration-200"
    >
      <Trash2 size={16} />
      <span>Clear</span>
    </Button>
  );
};

export default ClearButton;
