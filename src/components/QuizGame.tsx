import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, X, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { playSuccessSound, playFailSound } from "@/utils/sounds";

interface Word {
  id: string;
  english: string;
  hebrew: string;
}

interface WordStats {
  attempts: number;
  successes: number;
}

export const QuizGame = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentWordStats, setCurrentWordStats] = useState<WordStats | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionSuccesses, setSessionSuccesses] = useState(0);
  const [sessionErrors, setSessionErrors] = useState(0);
  const [wordOrder, setWordOrder] = useState<string>("random_priority_least_seen");

  useEffect(() => {
    fetchWords();
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("word_order, dark_mode")
      .eq("id", user.id)
      .single();

    if (profile) {
      setWordOrder(profile.word_order || "random_priority_least_seen");
      
      // Apply dark mode
      if (profile.dark_mode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

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

  const selectRandomWord = async (wordList: Word[]) => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let selectedWord: Word;

    if (wordOrder === "random") {
      // Pure random selection
      selectedWord = wordList[Math.floor(Math.random() * wordList.length)];
    } else {
      // Fetch all word stats for current user
      const { data: allStats } = await supabase
        .from("word_stats")
        .select("*")
        .eq("user_id", user.id);

      // Create a map of word_id to attempts count
      const statsMap = new Map(allStats?.map(s => [s.word_id, s.attempts]) || []);

      // Sort words by attempts (least practiced first)
      const sortedWords = [...wordList].sort((a, b) => {
        const attemptsA = statsMap.get(a.id) || 0;
        const attemptsB = statsMap.get(b.id) || 0;
        return attemptsA - attemptsB;
      });

      if (wordOrder === "least_seen") {
        // Always pick the least practiced word
        selectedWord = sortedWords[0];
      } else {
        // random_priority_least_seen: Pick from the least practiced 30% of words
        const poolSize = Math.max(1, Math.ceil(sortedWords.length * 0.3));
        const randomIndex = Math.floor(Math.random() * poolSize);
        selectedWord = sortedWords[randomIndex];
      }
    }
    
    setCurrentWord(selectedWord);
    setUserAnswer("");
    setShowResult(false);
    setShowAnswer(false);

    // Get stats for the selected word
    const { data: stats } = await supabase
      .from("word_stats")
      .select("*")
      .eq("word_id", selectedWord.id)
      .eq("user_id", user.id)
      .maybeSingle();
    
    setCurrentWordStats(stats);
  };

  const updateStats = async (wordId: string, success: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if stats exist for this word and user
    const { data: existingStats } = await supabase
      .from("word_stats")
      .select("*")
      .eq("word_id", wordId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingStats) {
      // Update existing stats
      await supabase
        .from("word_stats")
        .update({
          attempts: existingStats.attempts + 1,
          successes: success ? existingStats.successes + 1 : existingStats.successes,
        })
        .eq("id", existingStats.id);
    } else {
      // Create new stats
      await supabase.from("word_stats").insert({
        word_id: wordId,
        user_id: user.id,
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

    // Update session stats
    if (correct) {
      setSessionSuccesses(prev => prev + 1);
    } else {
      setSessionErrors(prev => prev + 1);
    }

    await updateStats(currentWord.id, correct);
    
    // Fetch updated stats for display
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: updatedStats } = await supabase
        .from("word_stats")
        .select("*")
        .eq("word_id", currentWord.id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      setCurrentWordStats(updatedStats);
    }

    if (correct) {
      playSuccessSound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success("🎉 Perfect!", {
        description: "Great job!",
      });
    } else {
      playFailSound();
    }

    setIsLoading(false);
  };

  const handleNext = () => {
    selectRandomWord(words);
  };

  const handleTryAgain = () => {
    setUserAnswer("");
    setShowResult(false);
    setShowAnswer(false);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleReset = () => {
    setSessionSuccesses(0);
    setSessionErrors(0);
    toast.success("Session stats reset");
  };

  const calculateSuccessRate = (stats: WordStats | null) => {
    if (!stats || stats.attempts === 0) return 0;
    return Math.round((stats.successes / stats.attempts) * 100);
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
    <div className="space-y-4">
      <Card className="shadow-lg bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="text-sm text-muted-foreground mb-1">Session Stats</div>
              <div className="flex items-center justify-center gap-4">
                <span className="text-lg font-semibold text-success">
                  ✓ {sessionSuccesses}
                </span>
                <span className="text-lg font-semibold text-fail">
                  ✗ {sessionErrors}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          {!showResult ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-2">Translate to English:</p>
                <h2 className="text-4xl font-bold" dir="rtl">
                  {currentWord.hebrew}
                </h2>
                {currentWordStats && currentWordStats.attempts > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Previous success rate: {calculateSuccessRate(currentWordStats)}% 
                    ({currentWordStats.successes}/{currentWordStats.attempts})
                  </div>
                )}
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
                  {currentWordStats && (
                    <div className="mt-4 p-4 bg-background/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
                      <div className="text-2xl font-bold text-success">
                        {calculateSuccessRate(currentWordStats)}%
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {currentWordStats.successes} correct out of {currentWordStats.attempts} attempts
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <X className="h-16 w-16 mx-auto text-fail" />
                  <h3 className="text-3xl font-bold text-fail">Not quite!</h3>
                  
                  {!showAnswer ? (
                    <div className="space-y-4 mt-6">
                      <p className="text-lg text-muted-foreground">
                        Would you like to try again or see the answer?
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleTryAgain} 
                          variant="outline"
                          className="flex-1"
                          size="lg"
                        >
                          Try Again
                        </Button>
                        <Button 
                          onClick={handleShowAnswer}
                          className="flex-1"
                          size="lg"
                        >
                          Show Answer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <p className="text-lg">
                          Your answer: <span className="font-bold">{userAnswer}</span>
                        </p>
                        <p className="text-lg">
                          Correct answer: <span className="font-bold text-success">{currentWord.english}</span>
                        </p>
                      </div>
                      {currentWordStats && (
                        <div className="mt-4 p-4 bg-background/50 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
                          <div className="text-2xl font-bold">
                            {calculateSuccessRate(currentWordStats)}%
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {currentWordStats.successes} correct out of {currentWordStats.attempts} attempts
                          </div>
                        </div>
                      )}
                      <Button 
                        onClick={handleTryAgain} 
                        variant="outline"
                        className="w-full mt-4"
                        size="lg"
                      >
                        Try Again
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
            {(isCorrect || showAnswer) && (
              <Button onClick={handleNext} className="w-full" size="lg">
                Next Word
              </Button>
            )}
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
};
