import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AdminPasswordDialog } from "@/components/AdminPasswordDialog";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Loader2, Upload, Trash2, Pencil, Check, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ApiUsageGuide } from "@/components/ApiUsageGuide";

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
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showClearStatsDialog, setShowClearStatsDialog] = useState(false);
  const [showClearStatsConfirm, setShowClearStatsConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEnglish, setEditEnglish] = useState("");
  const [editHebrew, setEditHebrew] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [sortColumn, setSortColumn] = useState<"hebrew" | "english" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const { error } = await supabase
        .from("words")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast.success("All words deleted successfully");
      fetchWords();
    } catch (error) {
      console.error("Error deleting all words:", error);
      toast.error("Failed to delete all words");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleStartEdit = (word: Word) => {
    setEditingId(word.id);
    setEditEnglish(word.english);
    setEditHebrew(word.hebrew);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditEnglish("");
    setEditHebrew("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editEnglish.trim() || !editHebrew.trim()) {
      toast.error("Both fields are required");
      return;
    }

    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from("words")
        .update({ english: editEnglish.trim(), hebrew: editHebrew.trim() })
        .eq("id", id);

      if (error) throw error;

      toast.success("Word updated successfully!");
      setEditingId(null);
      setEditEnglish("");
      setEditHebrew("");
      fetchWords();
    } catch (error) {
      console.error("Error updating word:", error);
      toast.error("Failed to update word");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleClearStats = async () => {
    try {
      const { error } = await supabase
        .from("word_stats")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

      if (error) throw error;

      toast.success("All stats cleared successfully");
      setShowClearStatsDialog(false);
      setShowClearStatsConfirm(false);
    } catch (error: any) {
      console.error("Error clearing stats:", error);
      toast.error("Failed to clear stats");
    }
  };

  const handleSort = (column: "hebrew" | "english") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedWords = [...words].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn].toLowerCase();
    const bVal = b[sortColumn].toLowerCase();
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortIcon = ({ column }: { column: "hebrew" | "english" }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-4 w-4 inline" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-1 h-4 w-4 inline" /> 
      : <ArrowDown className="ml-1 h-4 w-4 inline" />;
  };

  return (
    <div className="space-y-6">
      <ApiUsageGuide />
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              All Words ({words.length})
            </CardTitle>
            <div className="flex gap-2">
              <AlertDialog open={showClearStatsConfirm} onOpenChange={setShowClearStatsConfirm}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Stats
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all statistics
                      for all users and words from the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        setShowClearStatsConfirm(false);
                        setShowClearStatsDialog(true);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              {words.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={isDeletingAll}
                    >
                      {isDeletingAll ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete All Words
                    </Button>
                  </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all {words.length} words
                      and their associated statistics from the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete All Words
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              )}
            </div>
          </div>
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
                    <TableHead 
                      className="w-[40%] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("hebrew")}
                    >
                      Hebrew <SortIcon column="hebrew" />
                    </TableHead>
                    <TableHead 
                      className="w-[40%] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("english")}
                    >
                      English <SortIcon column="english" />
                    </TableHead>
                    <TableHead className="w-[20%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedWords.map((word) => (
                    <TableRow key={word.id}>
                      <TableCell className="font-medium" dir="rtl">
                        {editingId === word.id ? (
                          <Input
                            value={editHebrew}
                            onChange={(e) => setEditHebrew(e.target.value)}
                            dir="rtl"
                            className="h-8"
                          />
                        ) : (
                          word.hebrew
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === word.id ? (
                          <Input
                            value={editEnglish}
                            onChange={(e) => setEditEnglish(e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          word.english
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {editingId === word.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveEdit(word.id)}
                                disabled={isSavingEdit}
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                              >
                                {isSavingEdit ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                disabled={isSavingEdit}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(word)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
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
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminPasswordDialog
        open={showClearStatsDialog}
        onOpenChange={setShowClearStatsDialog}
        onSuccess={handleClearStats}
      />
    </div>
  );
};
