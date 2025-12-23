import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, X, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { playSuccessSound, playFailSound } from "@/utils/sounds";

interface Verb {
  id: string;
  hebrew: string;
  past: string;
  future: string;
}

interface VerbStats {
  attempts: number;
  successes: number;
}

export const VerbQuizGame = () => {
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [currentVerb, setCurrentVerb] = useState<Verb | null>(null);
  const [currentVerbStats, setCurrentVerbStats] = useState<VerbStats | null>(null);
  const [pastAnswer, setPastAnswer] = useState("");
  const [futureAnswer, setFutureAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPastCorrect, setIsPastCorrect] = useState(false);
  const [isFutureCorrect, setIsFutureCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionSuccesses, setSessionSuccesses] = useState(0);
  const [sessionErrors, setSessionErrors] = useState(0);
  const [wordOrder, setWordOrder] = useState<string>("random_priority_least_seen");
  const [currentVerbIndex, setCurrentVerbIndex] = useState<number>(0);

  useEffect(() => {
    fetchVerbs();
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("word_order")
      .eq("id", user.id)
      .single();

    if (profile) {
      setWordOrder(profile.word_order || "random_priority_least_seen");
    }
  };

  const fetchVerbs = async () => {
    const { data, error } = await supabase.from("verbs").select("*");
    if (error) {
      console.error("Error fetching verbs:", error);
      toast.error("Failed to load verbs");
      return;
    }
    if (data && data.length > 0) {
      setVerbs(data);
      selectRandomVerb(data);
    }
  };

  const selectRandomVerb = async (verbList: Verb[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let selectedVerb: Verb;

    const { data: allStats } = await supabase
      .from("verb_stats")
      .select("*")
      .eq("user_id", user.id);

    const skippedVerbIds = new Set(
      allStats?.filter(s => s.skipped).map(s => s.verb_id) || []
    );
    const availableVerbs = verbList.filter(v => !skippedVerbIds.has(v.id));

    if (availableVerbs.length === 0) {
      toast.error("All verbs are skipped! Please unskip some verbs in settings.");
      return;
    }

    if (wordOrder === "random") {
      selectedVerb = availableVerbs[Math.floor(Math.random() * availableVerbs.length)];
    } else if (wordOrder === "by_order") {
      selectedVerb = availableVerbs[currentVerbIndex % availableVerbs.length];
      setCurrentVerbIndex(prev => prev + 1);
    } else if (wordOrder === "lowest_success_rate") {
      const statsMap = new Map(allStats?.map(s => [s.verb_id, { attempts: s.attempts, successes: s.successes }]) || []);
      
      const sortedVerbs = [...availableVerbs].sort((a, b) => {
        const statsA = statsMap.get(a.id);
        const statsB = statsMap.get(b.id);
        
        const attemptsA = statsA?.attempts || 0;
        const attemptsB = statsB?.attempts || 0;
        
        if (attemptsA === 0 && attemptsB === 0) return 0;
        if (attemptsA === 0) return 1;
        if (attemptsB === 0) return -1;
        
        const rateA = statsA.successes / statsA.attempts;
        const rateB = statsB.successes / statsB.attempts;
        
        return rateA - rateB;
      });
      
      selectedVerb = sortedVerbs[0];
    } else {
      const statsMap = new Map(allStats?.map(s => [s.verb_id, s.attempts]) || []);

      const sortedVerbs = [...availableVerbs].sort((a, b) => {
        const attemptsA = statsMap.get(a.id) || 0;
        const attemptsB = statsMap.get(b.id) || 0;
        return attemptsA - attemptsB;
      });

      if (wordOrder === "least_seen") {
        selectedVerb = sortedVerbs[0];
      } else {
        const poolSize = Math.max(1, Math.ceil(sortedVerbs.length * 0.3));
        const randomIndex = Math.floor(Math.random() * poolSize);
        selectedVerb = sortedVerbs[randomIndex];
      }
    }
    
    setCurrentVerb(selectedVerb);
    setPastAnswer("");
    setFutureAnswer("");
    setShowResult(false);
    setShowAnswer(false);

    const { data: stats } = await supabase
      .from("verb_stats")
      .select("*")
      .eq("verb_id", selectedVerb.id)
      .eq("user_id", user.id)
      .maybeSingle();
    
    setCurrentVerbStats(stats);
  };

  const updateStats = async (verbId: string, success: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingStats } = await supabase
      .from("verb_stats")
      .select("*")
      .eq("verb_id", verbId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingStats) {
      await supabase
        .from("verb_stats")
        .update({
          attempts: existingStats.attempts + 1,
          successes: success ? existingStats.successes + 1 : existingStats.successes,
        })
        .eq("id", existingStats.id);
    } else {
      await supabase.from("verb_stats").insert({
        verb_id: verbId,
        user_id: user.id,
        attempts: 1,
        successes: success ? 1 : 0,
      });
    }
  };

  const normalizeAnswer = (answer: string) => {
    return answer.trim().toLowerCase().replace(/[\u0591-\u05C7]/g, "");
  };

  const handleSubmit = async () => {
    if (!currentVerb || (!pastAnswer.trim() && !futureAnswer.trim())) return;

    setIsLoading(true);
    
    const pastCorrect = normalizeAnswer(pastAnswer) === normalizeAnswer(currentVerb.past);
    const futureCorrect = normalizeAnswer(futureAnswer) === normalizeAnswer(currentVerb.future);
    const bothCorrect = pastCorrect && futureCorrect;
    
    setIsPastCorrect(pastCorrect);
    setIsFutureCorrect(futureCorrect);
    setShowResult(true);

    if (bothCorrect) {
      setSessionSuccesses(prev => prev + 1);
    } else {
      setSessionErrors(prev => prev + 1);
    }

    await updateStats(currentVerb.id, bothCorrect);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: updatedStats } = await supabase
        .from("verb_stats")
        .select("*")
        .eq("verb_id", currentVerb.id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      setCurrentVerbStats(updatedStats);
    }

    if (bothCorrect) {
      playSuccessSound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success("🎉 Perfect!", {
        description: "Both tenses correct!",
      });
    } else {
      playFailSound();
    }

    setIsLoading(false);
  };

  const handleNext = () => {
    selectRandomVerb(verbs);
  };

  const handleTryAgain = () => {
    setPastAnswer("");
    setFutureAnswer("");
    setShowResult(false);
    setShowAnswer(false);
  };

  const handleSkipForever = async () => {
    if (!currentVerb) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingStats } = await supabase
      .from("verb_stats")
      .select("*")
      .eq("verb_id", currentVerb.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingStats) {
      await supabase
        .from("verb_stats")
        .update({ skipped: true })
        .eq("id", existingStats.id);
    } else {
      await supabase
        .from("verb_stats")
        .insert({
          verb_id: currentVerb.id,
          user_id: user.id,
          skipped: true,
          attempts: 0,
          successes: 0,
        });
    }

    toast.success("Verb skipped", {
      description: "You can unskip it in settings",
    });

    handleNext();
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleReset = () => {
    setSessionSuccesses(0);
    setSessionErrors(0);
    toast.success("Session stats reset");
  };

  const calculateSuccessRate = (stats: VerbStats | null) => {
    if (!stats || stats.attempts === 0) return 0;
    return Math.round((stats.successes / stats.attempts) * 100);
  };

  if (!currentVerb) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No verbs available. Add some verbs in the Admin panel to start practicing!
          </p>
        </CardContent>
      </Card>
    );
  }

  const bothCorrect = isPastCorrect && isFutureCorrect;

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          {!showResult ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-2">Conjugate this verb:</p>
                <h2 className="text-4xl font-bold" dir="rtl">
                  {currentVerb.hebrew}
                </h2>
                {currentVerbStats && currentVerbStats.attempts > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Previous success rate: {calculateSuccessRate(currentVerbStats)}% 
                    ({currentVerbStats.successes}/{currentVerbStats.attempts})
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-center block">Past (עבר)</label>
                    <Input
                      value={pastAnswer}
                      onChange={(e) => setPastAnswer(e.target.value)}
                      placeholder="Type past tense..."
                      className="text-lg text-center"
                      dir="rtl"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-center block">Future (עתיד)</label>
                    <Input
                      value={futureAnswer}
                      onChange={(e) => setFutureAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="Type future tense..."
                      className="text-lg text-center"
                      dir="rtl"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || (!pastAnswer.trim() && !futureAnswer.trim())}
                  className="w-full"
                  size="lg"
                >
                  Check Answers
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div
                className={`text-center py-12 rounded-lg transition-all duration-500 ${
                  bothCorrect
                    ? "bg-success-light animate-pulse"
                    : "bg-fail-light"
                }`}
              >
                {bothCorrect ? (
                  <div className="space-y-4">
                    <Sparkles className="h-16 w-16 mx-auto text-success animate-bounce" />
                    <h3 className="text-3xl font-bold text-success">
                      Perfect! 🎉
                    </h3>
                    <div className="space-y-2">
                      <p className="text-lg" dir="rtl">
                        <span className="font-bold">{currentVerb.hebrew}</span>
                      </p>
                      <p className="text-lg" dir="rtl">
                        Past: <span className="font-bold text-success">{currentVerb.past}</span>
                      </p>
                      <p className="text-lg" dir="rtl">
                        Future: <span className="font-bold text-success">{currentVerb.future}</span>
                      </p>
                    </div>
                    {currentVerbStats && (
                      <div className="mt-4 p-4 bg-background/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
                        <div className="text-2xl font-bold text-success">
                          {calculateSuccessRate(currentVerbStats)}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {currentVerbStats.successes} correct out of {currentVerbStats.attempts} attempts
                        </div>
                      </div>
                    )}
                    <Button 
                      onClick={handleSkipForever}
                      variant="outline"
                      className="mt-4"
                      size="lg"
                    >
                      Skip Forever
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <X className="h-16 w-16 mx-auto text-fail" />
                    <h3 className="text-3xl font-bold text-fail">Not quite!</h3>
                    
                    {!showAnswer ? (
                      <div className="space-y-4 mt-6">
                        <div className="space-y-2">
                          <p className="text-lg" dir="rtl">
                            Past: {isPastCorrect ? (
                              <span className="text-success font-bold">✓ Correct</span>
                            ) : (
                              <span className="text-fail font-bold">✗ Incorrect</span>
                            )}
                          </p>
                          <p className="text-lg" dir="rtl">
                            Future: {isFutureCorrect ? (
                              <span className="text-success font-bold">✓ Correct</span>
                            ) : (
                              <span className="text-fail font-bold">✗ Incorrect</span>
                            )}
                          </p>
                        </div>
                        <p className="text-lg text-muted-foreground">
                          Would you like to try again or see the answers?
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
                            Show Answers
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <p className="text-lg" dir="rtl">
                            Your past: <span className={`font-bold ${isPastCorrect ? 'text-success' : ''}`}>{pastAnswer || '(empty)'}</span>
                          </p>
                          <p className="text-lg" dir="rtl">
                            Correct past: <span className="font-bold text-success">{currentVerb.past}</span>
                          </p>
                          <p className="text-lg mt-4" dir="rtl">
                            Your future: <span className={`font-bold ${isFutureCorrect ? 'text-success' : ''}`}>{futureAnswer || '(empty)'}</span>
                          </p>
                          <p className="text-lg" dir="rtl">
                            Correct future: <span className="font-bold text-success">{currentVerb.future}</span>
                          </p>
                        </div>
                        {currentVerbStats && (
                          <div className="mt-4 p-4 bg-background/50 rounded-lg">
                            <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
                            <div className="text-2xl font-bold">
                              {calculateSuccessRate(currentVerbStats)}%
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {currentVerbStats.successes} correct out of {currentVerbStats.attempts} attempts
                            </div>
                          </div>
                        )}
                        <Button 
                          onClick={handleTryAgain} 
                          variant="outline"
                          className="w-full mt-6"
                          size="lg"
                        >
                          Try Again
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {(bothCorrect || showAnswer) && (
                <Button onClick={handleNext} className="w-full" size="lg">
                  Next Verb
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};