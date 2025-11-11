import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all word stats with profiles and words
      const { data: stats, error: statsError } = await supabase
        .from("word_stats")
        .select(`
          *,
          profiles:user_id (name),
          words:word_id (english, hebrew)
        `);

      if (statsError) throw statsError;

      if (stats) {
        // Aggregate by user
        const userMap = new Map<string, UserStats>();
        const wordStatsList: WordStat[] = [];

        stats.forEach((stat: any) => {
          const userId = stat.user_id;
          const userName = stat.profiles?.name || "Unknown";
          
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
          if (stat.words) {
            wordStatsList.push({
              wordId: stat.word_id,
              english: stat.words.english,
              hebrew: stat.words.hebrew,
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
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Game
        </Button>

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
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead className="text-right">Successes</TableHead>
                  <TableHead className="text-right">Success Rate</TableHead>
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
                  userStats.map((stat) => (
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
                  <TableHead>Word (Hebrew)</TableHead>
                  <TableHead>Translation</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead className="text-right">Successes</TableHead>
                  <TableHead className="text-right">Success Rate</TableHead>
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
                  wordStats.map((stat, idx) => (
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
