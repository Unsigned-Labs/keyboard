import { typingPracticeData } from "@/data/typingPracticeData";

export type PracticeLevel = {
  level: number;
  text: string;
};

export const getPracticeLevels = (): PracticeLevel[] => {
  return typingPracticeData.map((text) => ({
    level: typingPracticeData.indexOf(text) + 1,
    text,
  }));
};
