import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";

interface Word {
  id: string;
  english: string;
  hebrew: string;
}

export const QuizGame = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    const { data, error } = await supabase.from("words").select("*");
    if (error) {
      console.error("Error fetching words:", error);
      toast.error("Failed to load words");
      return;
    }
    if (data && data.length > 0) {
      setWords(data);
      selectRandomWord(data);
    }
  };

  const selectRandomWord = (wordList: Word[]) => {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    setCurrentWord(wordList[randomIndex]);
    setUserAnswer("");
    setShowResult(false);
  };

  const updateStats = async (wordId: string, success: boolean) => {
    // Check if stats exist for this word
    const { data: existingStats } = await supabase
      .from("word_stats")
      .select("*")
      .eq("word_id", wordId)
      .single();

    if (existingStats) {
      // Update existing stats
      await supabase
        .from("word_stats")
        .update({
          attempts: existingStats.attempts + 1,
          successes: success ? existingStats.successes + 1 : existingStats.successes,
        })
        .eq("word_id", wordId);
    } else {
      // Create new stats
      await supabase.from("word_stats").insert({
        word_id: wordId,
        attempts: 1,
        successes: success ? 1 : 0,
      });
    }
  };

  const handleSubmit = async () => {
    if (!currentWord || !userAnswer.trim()) return;

    setIsLoading(true);
    const correct =
      userAnswer.trim().toLowerCase() === currentWord.english.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);

    await updateStats(currentWord.id, correct);

    if (correct) {
      toast.success("🎉 Perfect!", {
        description: "Great job!",
      });
    }

    setIsLoading(false);
  };

  const handleNext = () => {
    selectRandomWord(words);
  };

  if (!currentWord) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No words available. Add some words to start practicing!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="pt-6">
        {!showResult ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">Translate to English:</p>
              <h2 className="text-4xl font-bold" dir="rtl">
                {currentWord.hebrew}
              </h2>
            </div>
            <div className="space-y-4">
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Type your answer..."
                className="text-lg text-center"
                autoFocus
              />
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !userAnswer.trim()}
                className="w-full"
                size="lg"
              >
                Check Answer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              className={`text-center py-12 rounded-lg transition-all duration-500 ${
                isCorrect
                  ? "bg-success-light animate-pulse"
                  : "bg-fail-light"
              }`}
            >
              {isCorrect ? (
                <div className="space-y-4">
                  <Sparkles className="h-16 w-16 mx-auto text-success animate-bounce" />
                  <h3 className="text-3xl font-bold text-success">
                    Perfect! 🎉
                  </h3>
                  <p className="text-lg">
                    <span className="font-bold" dir="rtl">{currentWord.hebrew}</span> = {currentWord.english}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <X className="h-16 w-16 mx-auto text-fail" />
                  <h3 className="text-3xl font-bold text-fail">Not quite!</h3>
                  <div className="space-y-2">
                    <p className="text-lg">
                      Your answer: <span className="font-bold">{userAnswer}</span>
                    </p>
                    <p className="text-lg">
                      Correct answer: <span className="font-bold text-success">{currentWord.english}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleNext} className="w-full" size="lg">
              Next Word
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
