/* eslint-disable react/no-unescaped-entities */
import React from "react";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { assameseSchema } from "@/utils/assameseSchema";

const TypingInfoDialog: React.FC = () => {
  const consonantGrid = [
    ["ক", "খ", "গ", "ঘ", "ঙ"],
    ["চ", "ছ", "জ", "ঝ", "ঞ"],
    ["ট", "ঠ", "ড", "ঢ", "ণ"],
    ["ত", "থ", "দ", "ধ", "ন"],
    ["প", "ফ", "ব", "ভ", "ম"],
    ["য", "ৰ", "ল", "ৱ", ""],
    ["শ", "ষ", "স", "হ", ""],
    ["ড়", "ঢ়", "য়", "ক্ষ", ""],
  ];

  const renderCharacterGrid = (
    chars: string[],
    transliterations: Record<string, string[]>
  ) => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {chars.map((char) => (
          <div
            key={char}
            className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md flex flex-col items-center"
          >
            <span className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {char}
            </span>
            <div className="text-sm text-blue-600 dark:text-blue-400 text-center">
              {transliterations[char]?.map((combo, i) => (
                <span
                  key={i}
                  className="inline-block px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded m-0.5"
                >
                  {combo}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderExceptions = () => {
    return (
      <div className="space-y-4">
        {Object.entries(assameseSchema.exceptions).map(
          ([exceptionType, exceptions]) => (
            <div key={exceptionType}>
              <h4 className="text-lg font-semibold mb-2 capitalize">
                {exceptionType.replace(/([A-Z])/g, " $1").trim()}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {Object.entries(exceptions).map(([combo, result]) => (
                  <div
                    key={combo}
                    className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md flex flex-col items-center"
                  >
                    <span className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      {combo}
                    </span>
                    <div className="text-sm text-blue-600 dark:text-blue-400 text-center">
                      <span className="inline-block px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded m-0.5">
                        {result}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  const renderInstructions = () => {
    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
          How to Use the Keyboard:
        </h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            কোনো এটা স্বৰবৰ্ণক কোনো ব্যঞ্জনবৰ্ণৰ পাছত বৰ্ণ হিচাপেই লিখিবলৈ হ'লে
            fullstop ৰ ব্যবহাৰ কৰক। উদাহৰণ স্বৰূপে: 'moi' বুলি লিখিলে মৈ বুলি
            দেখা পাব, কিন্তু মই বুলি লিখিব হ'লে 'm.i' 'mo.i বুলি লিখিব লাগিব{" "}
          </li>
          <li> ঁ (চন্দ্ৰবিন্দু) লিখিবলৈ * (এষ্টৰিক্স) ব্যৱহাৰ কৰক।</li>
          <li>
            কোনো এটা ইংৰাজি শব্দ ইংৰাজিতে ৰাখিবলৈ, তাক বেকটিক (`)ৰে আৱৰি ৰাখক।
          </li>
          <li>
            বৰ্ণবোৰ হলন্ত (্) ব্যৱহাৰ নকৰাকৈয়ে স্বয়ংক্ৰিয়ভাৱে সংযোগ হয়।
            বৰ্ণবোৰ সংযোগ নকৰাকৈ লিখিবলৈ 'o' ব্যৱহাৰ কৰক। উদাহৰণস্বৰূপ: 'tejpur'
            বুলি লিখিলে তেজ্পুৰ, আৰু 'tejopur' বুলি লিখিলে তেজপুৰ বুলি দেখুৱাব।
          </li>
          <li> । (দাৰি) ডাল লিখিবলৈ '|' ব্যৱহাৰ কৰক।</li>
          <li>
            একেটা উচ্চাৰণৰে অন্য এটা বৰ্ণ পাবৰ বাবে shift ৰ ব্যৱহাৰ কৰক, নাইবা
            একেটা বৰ্ণকে একাধিকবাৰ টিপক । উদাহৰণস্বৰূপ: ত-টো লিখিবলৈ t, আৰু ট-টো
            লিখিবলৈ T, বা স, শ, আৰু ষ লিখিবৰ বাবে x, xx, আৰু xxx ৰ ব্যবহাৰ কৰিব
            পাৰে।
          </li>
        </ul>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-2xl mb-4">
            How to Type Assamese Characters
          </DialogTitle>
        </DialogHeader>
        {renderInstructions()}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Consonants</h3>
            {renderCharacterGrid(
              consonantGrid.flat().filter(Boolean),
              assameseSchema.consonants
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Vowels</h3>
            {renderCharacterGrid(
              Object.keys(assameseSchema.vowels),
              assameseSchema.vowels
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Vowel Marks</h3>
            {renderCharacterGrid(
              Object.keys(assameseSchema.vowelMarks),
              assameseSchema.vowelMarks
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Special Characters</h3>
            {renderCharacterGrid(
              Object.keys(assameseSchema.specialChar),
              assameseSchema.specialChar
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Digits</h3>
            {renderCharacterGrid(
              Object.keys(assameseSchema.digits),
              assameseSchema.digits
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Exceptions</h3>
            {renderExceptions()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TypingInfoDialog;
