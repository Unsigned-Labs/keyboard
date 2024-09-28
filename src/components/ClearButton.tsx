import React from "react";
import { Button } from "@/components/ui/button";

interface ClearButtonProps {
  onClick: () => void;
}

const ClearButton: React.FC<ClearButtonProps> = ({ onClick }) => {
  return (
    <Button onClick={onClick} variant="outline" size="sm">
      Clear
    </Button>
  );
};

export default ClearButton;
