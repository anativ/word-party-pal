import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, X, Shuffle, Eye } from "lucide-react";
import confetti from "canvas-confetti";
import { playSuccessSound, playFailSound } from "@/utils/sounds";
import { checkSentence, SentenceResult } from "@/lib/sentenceCheck";

interface Word {
  id: string;
  english: string;
  hebrew: string;
}

const pickTwo = (list: Word[]): Word[] => {
  const pool = [...list];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 2);
};

export const SentenceGame = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [pair, setPair] = useState<Word[]>([]);
  const [sentence, setSentence] = useState("");
  const [result, setResult] = useState<SentenceResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [good, setGood] = useState(0);
  const [bad, setBad] = useState(0);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("words").select("*");
      if (error) {
        console.error("Error fetching words:", error);
        toast.error("Failed to load words");
        return;
      }
      if (data && data.length >= 2) {
        setWords(data);
        setPair(pickTwo(data));
      } else {
        toast.error("Need at least 2 words in the list");
      }
    })();
  }, []);

  const next = () => {
    setPair(pickTwo(words));
    setSentence("");
    setResult(null);
    setShowHint(false);
  };

  const handleCheck = () => {
    const r = checkSentence(sentence, pair);
    setResult(r);
    if (r.ok) {
      setGood((n) => n + 1);
      playSuccessSound();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } else {
      setBad((n) => n + 1);
      playFailSound();
    }
  };

  if (pair.length < 2) {
    return <div className="text-center text-muted-foreground py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Write one English sentence that uses both words:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {pair.map((w) => (
                <div key={w.id} className="px-5 py-3 rounded-lg bg-primary/10 text-center">
                  <div className="text-3xl font-bold" dir="rtl">{w.hebrew}</div>
                  {showHint && <div className="text-sm text-muted-foreground mt-1">{w.english}</div>}
                </div>
              ))}
            </div>
            {!showHint && (
              <Button variant="ghost" size="sm" onClick={() => setShowHint(true)}>
                <Eye className="h-4 w-4 mr-2" /> Show English words
              </Button>
            )}
          </div>

          {!result ? (
            <div className="space-y-4">
              <Textarea
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                placeholder="Type your sentence..."
                className="text-lg"
                rows={3}
                autoFocus
              />
              <Button onClick={handleCheck} disabled={!sentence.trim()} className="w-full" size="lg">
                Check Sentence
              </Button>
              <Button onClick={next} variant="outline" className="w-full">
                <Shuffle className="h-4 w-4 mr-2" /> Different words
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`text-center py-8 rounded-lg ${result.ok ? "bg-success-light" : "bg-fail-light"}`}>
                {result.ok ? (
                  <>
                    <Sparkles className="h-14 w-14 mx-auto text-success animate-bounce" />
                    <h3 className="text-2xl font-bold text-success mt-2">Great sentence! 🎉</h3>
                  </>
                ) : (
                  <>
                    <X className="h-14 w-14 mx-auto text-fail" />
                    <h3 className="text-2xl font-bold text-fail mt-2">Not quite yet</h3>
                  </>
                )}
                <p className="mt-3 px-4 text-lg font-medium">{sentence}</p>
                {result.issues.length > 0 && (
                  <ul className="mt-4 px-6 space-y-1 text-left list-disc list-inside text-sm">
                    {result.issues.map((i) => (
                      <li key={i.message}>{i.message}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 px-4 text-xs text-muted-foreground">
                  This check looks for the two words and basic mistakes. It cannot judge every kind of grammar or meaning.
                </p>
              </div>
              <div className="flex gap-3">
                {!result.ok && (
                  <Button onClick={() => setResult(null)} variant="outline" className="flex-1" size="lg">
                    Try Again
                  </Button>
                )}
                <Button onClick={next} className="flex-1" size="lg">
                  Next Words
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-muted/50">
        <CardContent className="pt-6 text-center">
          <div className="text-sm text-muted-foreground mb-1">Session Stats</div>
          <div className="flex items-center justify-center gap-4">
            <span className="text-lg font-semibold text-success">✓ {good}</span>
            <span className="text-lg font-semibold text-fail">✗ {bad}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
