import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserStats {
  userId: string;
  userName: string;
  totalAttempts: number;
  totalSuccesses: number;
  successRate: number;
}

interface WordStat {
  wordId: string;
  english: string;
  hebrew: string;
  userName: string;
  attempts: number;
  successes: number;
  successRate: number;
}

export const Stats = () => {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [wordStats, setWordStats] = useState<WordStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSortKey, setUserSortKey] = useState<keyof UserStats | null>(null);
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('desc');
  const [wordSortKey, setWordSortKey] = useState<keyof WordStat | null>(null);
  const [wordSortOrder, setWordSortOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all word stats
      const { data: stats, error: statsError } = await supabase
        .from("word_stats")
        .select("*");

      if (statsError) throw statsError;

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Fetch all words
      const { data: words, error: wordsError } = await supabase
        .from("words")
        .select("*");

      if (wordsError) throw wordsError;

      if (stats && profiles && words) {
        // Create lookup maps
        const profileMap = new Map(profiles.map(p => [p.id, p.name]));
        const wordMap = new Map(words.map(w => [w.id, { english: w.english, hebrew: w.hebrew }]));

        // Aggregate by user
        const userMap = new Map<string, UserStats>();
        const wordStatsList: WordStat[] = [];

        stats.forEach((stat) => {
          const userId = stat.user_id;
          const userName = profileMap.get(userId) || "Unknown";
          const word = wordMap.get(stat.word_id);
          
          // Aggregate user stats
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              userId,
              userName,
              totalAttempts: 0,
              totalSuccesses: 0,
              successRate: 0,
            });
          }
          
          const userStat = userMap.get(userId)!;
          userStat.totalAttempts += stat.attempts;
          userStat.totalSuccesses += stat.successes;

          // Add word stats
          if (word) {
            wordStatsList.push({
              wordId: stat.word_id,
              english: word.english,
              hebrew: word.hebrew,
              userName,
              attempts: stat.attempts,
              successes: stat.successes,
              successRate: stat.attempts > 0 ? Math.round((stat.successes / stat.attempts) * 100) : 0,
            });
          }
        });

        // Calculate success rates
        const userStatsList = Array.from(userMap.values()).map(stat => ({
          ...stat,
          successRate: stat.totalAttempts > 0 
            ? Math.round((stat.totalSuccesses / stat.totalAttempts) * 100) 
            : 0,
        }));

        setUserStats(userStatsList);
        setWordStats(wordStatsList);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleUserSort = (key: keyof UserStats) => {
    if (userSortKey === key) {
      setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortKey(key);
      setUserSortOrder('desc');
    }
  };

  const handleWordSort = (key: keyof WordStat) => {
    if (wordSortKey === key) {
      setWordSortOrder(wordSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setWordSortKey(key);
      setWordSortOrder('desc');
    }
  };

  const sortedUserStats = [...userStats].sort((a, b) => {
    if (!userSortKey) return 0;
    const aVal = a[userSortKey];
    const bVal = b[userSortKey];
    const order = userSortOrder === 'asc' ? 1 : -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * order;
    }
    return ((aVal as number) - (bVal as number)) * order;
  });

  const sortedWordStats = [...wordStats].sort((a, b) => {
    if (!wordSortKey) return 0;
    const aVal = a[wordSortKey];
    const bVal = b[wordSortKey];
    const order = wordSortOrder === 'asc' ? 1 : -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * order;
    }
    return ((aVal as number) - (bVal as number)) * order;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game
          </Button>
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Learning Statistics
        </h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleUserSort('userName')}>
                    <div className="flex items-center gap-2">
                      User <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleUserSort('totalAttempts')}>
                    <div className="flex items-center justify-end gap-2">
                      Attempts <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleUserSort('totalSuccesses')}>
                    <div className="flex items-center justify-end gap-2">
                      Successes <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleUserSort('successRate')}>
                    <div className="flex items-center justify-end gap-2">
                      Success Rate <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No stats yet. Start practicing!
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUserStats.map((stat) => (
                    <TableRow key={stat.userId}>
                      <TableCell className="font-medium">{stat.userName}</TableCell>
                      <TableCell className="text-right">{stat.totalAttempts}</TableCell>
                      <TableCell className="text-right text-success">{stat.totalSuccesses}</TableCell>
                      <TableCell className="text-right">
                        <span className={stat.successRate >= 70 ? "text-success" : "text-fail"}>
                          {stat.successRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Word Statistics by User</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleWordSort('hebrew')}>
                    <div className="flex items-center gap-2">
                      Word (Hebrew) <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleWordSort('english')}>
                    <div className="flex items-center gap-2">
                      Translation <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleWordSort('userName')}>
                    <div className="flex items-center gap-2">
                      User <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleWordSort('attempts')}>
                    <div className="flex items-center justify-end gap-2">
                      Attempts <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleWordSort('successes')}>
                    <div className="flex items-center justify-end gap-2">
                      Successes <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleWordSort('successRate')}>
                    <div className="flex items-center justify-end gap-2">
                      Success Rate <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wordStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No word stats yet. Start practicing!
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedWordStats.map((stat, idx) => (
                    <TableRow key={`${stat.wordId}-${stat.userName}-${idx}`}>
                      <TableCell dir="rtl" className="font-medium">{stat.hebrew}</TableCell>
                      <TableCell>{stat.english}</TableCell>
                      <TableCell>{stat.userName}</TableCell>
                      <TableCell className="text-right">{stat.attempts}</TableCell>
                      <TableCell className="text-right text-success">{stat.successes}</TableCell>
                      <TableCell className="text-right">
                        <span className={stat.successRate >= 70 ? "text-success" : "text-fail"}>
                          {stat.successRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
