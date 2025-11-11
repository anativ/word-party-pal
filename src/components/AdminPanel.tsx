import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Word {
  id: string;
  english: string;
  hebrew: string;
  created_at: string;
}

export const AdminPanel = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [english, setEnglish] = useState("");
  const [hebrew, setHebrew] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    const { data, error } = await supabase
      .from("words")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching words:", error);
      toast.error("Failed to load words");
      return;
    }
    
    setWords(data || []);
  };

  const handleAddWord = async () => {
    if (!english.trim() || !hebrew.trim()) {
      toast.error("Both fields are required");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("words")
        .insert([{ english: english.trim(), hebrew: hebrew.trim() }]);

      if (error) throw error;

      toast.success("Word added successfully! 🎉");
      setEnglish("");
      setHebrew("");
      fetchWords();
    } catch (error) {
      console.error("Error adding word:", error);
      toast.error("Failed to add word");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWord = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("words")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Word deleted");
      fetchWords();
    } catch (error) {
      console.error("Error deleting word:", error);
      toast.error("Failed to delete word");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Add New Word</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hebrew</label>
              <Input
                value={hebrew}
                onChange={(e) => setHebrew(e.target.value)}
                placeholder="Enter Hebrew word"
                className="text-lg"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">English</label>
              <Input
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                placeholder="Enter English translation"
                className="text-lg"
              />
            </div>
          </div>
          <Button
            onClick={handleAddWord}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            Add Word
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            All Words ({words.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {words.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No words added yet. Add your first word above!
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Hebrew</TableHead>
                    <TableHead className="w-[40%]">English</TableHead>
                    <TableHead className="w-[20%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {words.map((word) => (
                    <TableRow key={word.id}>
                      <TableCell className="font-medium" dir="rtl">
                        {word.hebrew}
                      </TableCell>
                      <TableCell>{word.english}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteWord(word.id)}
                          disabled={deletingId === word.id}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deletingId === word.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
