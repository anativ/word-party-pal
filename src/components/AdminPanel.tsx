import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Loader2, Upload } from "lucide-react";
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
  const [bulkJsonData, setBulkJsonData] = useState("");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

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

  const handleBulkUpload = async () => {
    if (!bulkJsonData.trim()) {
      toast.error("Please paste JSON data");
      return;
    }

    setIsBulkUploading(true);
    try {
      const parsed = JSON.parse(bulkJsonData);
      
      // Validate the structure
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of word objects");
      }

      // Validate each word has english and hebrew fields
      const validWords = parsed.filter(item => {
        if (typeof item !== 'object' || !item.english || !item.hebrew) {
          return false;
        }
        return true;
      });

      if (validWords.length === 0) {
        throw new Error("No valid words found. Each word must have 'english' and 'hebrew' fields");
      }

      // Insert all words
      const { error } = await supabase
        .from("words")
        .insert(validWords.map(w => ({
          english: w.english.trim(),
          hebrew: w.hebrew.trim()
        })));

      if (error) throw error;

      toast.success(`Successfully added ${validWords.length} words! 🎉`);
      setBulkJsonData("");
      setIsBulkDialogOpen(false);
      fetchWords();
    } catch (error) {
      console.error("Error bulk uploading:", error);
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON format. Please check your data.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to upload words");
      }
    } finally {
      setIsBulkUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Add New Word</CardTitle>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
            </div>
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

        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Words</DialogTitle>
            <DialogDescription>
              Paste your JSON data below. The format should be an array of objects with 'english' and 'hebrew' fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">JSON Data</label>
              <Textarea
                value={bulkJsonData}
                onChange={(e) => setBulkJsonData(e.target.value)}
                placeholder={`[\n  { "english": "hello", "hebrew": "שלום" },\n  { "english": "world", "hebrew": "עולם" }\n]`}
                className="font-mono text-sm min-h-[300px]"
              />
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">Example format:</p>
              <pre className="text-xs overflow-x-auto">
{`[
  { "english": "hello", "hebrew": "שלום" },
  { "english": "world", "hebrew": "עולם" },
  { "english": "thank you", "hebrew": "תודה" }
]`}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBulkUpload}
                disabled={isBulkUploading || !bulkJsonData.trim()}
                className="flex-1"
              >
                {isBulkUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Words
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setBulkJsonData("");
                  setIsBulkDialogOpen(false);
                }}
                disabled={isBulkUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
