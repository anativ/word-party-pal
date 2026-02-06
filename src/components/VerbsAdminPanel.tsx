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

interface Verb {
  id: string;
  hebrew: string;
  past: string;
  present: string;
  created_at: string;
}

export const VerbsAdminPanel = () => {
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [hebrew, setHebrew] = useState("");
  const [past, setPast] = useState("");
  const [present, setPresent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkJsonData, setBulkJsonData] = useState("");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showClearStatsDialog, setShowClearStatsDialog] = useState(false);
  const [showClearStatsConfirm, setShowClearStatsConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHebrew, setEditHebrew] = useState("");
  const [editPast, setEditPast] = useState("");
  const [editPresent, setEditPresent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [sortColumn, setSortColumn] = useState<"hebrew" | "past" | "present" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchVerbs();
  }, []);

  const fetchVerbs = async () => {
    const { data, error } = await supabase
      .from("verbs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching verbs:", error);
      toast.error("Failed to load verbs");
      return;
    }
    
    setVerbs(data || []);
  };

  const handleAddVerb = async () => {
    if (!hebrew.trim() || !past.trim() || !present.trim()) {
      toast.error("All fields are required");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("verbs")
        .insert([{ hebrew: hebrew.trim(), past: past.trim(), present: present.trim() }]);

      if (error) throw error;

      toast.success("Verb added successfully! 🎉");
      setHebrew("");
      setPast("");
      setPresent("");
      fetchVerbs();
    } catch (error) {
      console.error("Error adding verb:", error);
      toast.error("Failed to add verb");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVerb = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("verbs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Verb deleted");
      fetchVerbs();
    } catch (error) {
      console.error("Error deleting verb:", error);
      toast.error("Failed to delete verb");
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
      
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of verb objects");
      }

      const validVerbs = parsed.filter(item => {
        if (typeof item !== 'object' || !item.hebrew || !item.past || !item.present) {
          return false;
        }
        return true;
      });

      if (validVerbs.length === 0) {
        throw new Error("No valid verbs found. Each verb must have 'hebrew', 'past', and 'present' fields");
      }

      const { error } = await supabase
        .from("verbs")
        .insert(validVerbs.map(v => ({
          hebrew: v.hebrew.trim(),
          past: v.past.trim(),
          present: v.present.trim()
        })));

      if (error) throw error;

      toast.success(`Successfully added ${validVerbs.length} verbs! 🎉`);
      setBulkJsonData("");
      setIsBulkDialogOpen(false);
      fetchVerbs();
    } catch (error) {
      console.error("Error bulk uploading:", error);
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON format. Please check your data.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to upload verbs");
      }
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const { error } = await supabase
        .from("verbs")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast.success("All verbs deleted successfully");
      fetchVerbs();
    } catch (error) {
      console.error("Error deleting all verbs:", error);
      toast.error("Failed to delete all verbs");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleStartEdit = (verb: Verb) => {
    setEditingId(verb.id);
    setEditHebrew(verb.hebrew);
    setEditPast(verb.past);
    setEditPresent(verb.present);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditHebrew("");
    setEditPast("");
    setEditPresent("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editHebrew.trim() || !editPast.trim() || !editPresent.trim()) {
      toast.error("All fields are required");
      return;
    }

    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from("verbs")
        .update({ 
          hebrew: editHebrew.trim(), 
          past: editPast.trim(), 
          present: editPresent.trim() 
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Verb updated successfully!");
      setEditingId(null);
      setEditHebrew("");
      setEditPast("");
      setEditPresent("");
      fetchVerbs();
    } catch (error) {
      console.error("Error updating verb:", error);
      toast.error("Failed to update verb");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleClearStats = async () => {
    try {
      const { error } = await supabase
        .from("verb_stats")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast.success("All verb stats cleared successfully");
      setShowClearStatsDialog(false);
      setShowClearStatsConfirm(false);
    } catch (error: any) {
      console.error("Error clearing stats:", error);
      toast.error("Failed to clear stats");
    }
  };

  const handleSort = (column: "hebrew" | "past" | "present") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedVerbs = [...verbs].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn].toLowerCase();
    const bVal = b[sortColumn].toLowerCase();
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortIcon = ({ column }: { column: "hebrew" | "past" | "present" }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-4 w-4 inline" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-1 h-4 w-4 inline" /> 
      : <ArrowDown className="ml-1 h-4 w-4 inline" />;
  };

  return (
    <div className="space-y-6">
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Add New Verb</CardTitle>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hebrew (Infinitive)</label>
                <Input
                  value={hebrew}
                  onChange={(e) => setHebrew(e.target.value)}
                  placeholder="e.g., לָלֶכֶת"
                  className="text-lg"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Past</label>
                <Input
                  value={past}
                  onChange={(e) => setPast(e.target.value)}
                  placeholder="e.g., הָלַכְתִּי"
                  className="text-lg"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Present</label>
                <Input
                  value={present}
                  onChange={(e) => setPresent(e.target.value)}
                  placeholder="e.g., הוֹלֵךְ"
                  className="text-lg"
                  dir="rtl"
                />
              </div>
            </div>
            <Button
              onClick={handleAddVerb}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-5 w-5" />
              )}
              Add Verb
            </Button>
          </CardContent>
        </Card>

        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Verbs</DialogTitle>
            <DialogDescription>
              Paste your JSON data below. The format should be an array of objects with 'hebrew', 'past', and 'present' fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">JSON Data</label>
              <Textarea
                value={bulkJsonData}
                onChange={(e) => setBulkJsonData(e.target.value)}
                placeholder={`[\n  { "hebrew": "לָלֶכֶת", "past": "past", "present": "present" },\n  { "hebrew": "לֶאֱכֹל", "past": "past", "present": "present" }\n]`}
                className="font-mono text-sm min-h-[300px]"
                dir="rtl"
              />
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">Example format:</p>
              <pre className="text-xs overflow-x-auto" dir="rtl">
{`[
  { "hebrew": "לָלֶכֶת", "past": "past", "present": "present" },
  { "hebrew": "לֶאֱכֹל", "past": "past", "present": "present" }
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
                Upload Verbs
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
              All Verbs ({verbs.length})
            </CardTitle>
            <div className="flex gap-2">
              <AlertDialog open={showClearStatsConfirm} onOpenChange={setShowClearStatsConfirm}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Verb Stats
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all verb statistics
                      for all users from the database.
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
              
              {verbs.length > 0 && (
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
                      Delete All Verbs
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all {verbs.length} verbs
                        and their associated statistics from the database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAll}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete All Verbs
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {verbs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No verbs added yet. Add your first verb above!
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="w-[25%] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("hebrew")}
                    >
                      Hebrew <SortIcon column="hebrew" />
                    </TableHead>
                    <TableHead 
                      className="w-[25%] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("past")}
                    >
                      Past <SortIcon column="past" />
                    </TableHead>
                    <TableHead 
                      className="w-[25%] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("present")}
                    >
                      Present <SortIcon column="present" />
                    </TableHead>
                    <TableHead className="w-[25%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVerbs.map((verb) => (
                    <TableRow key={verb.id}>
                      <TableCell className="font-medium" dir="rtl">
                        {editingId === verb.id ? (
                          <Input
                            value={editHebrew}
                            onChange={(e) => setEditHebrew(e.target.value)}
                            dir="rtl"
                            className="h-8"
                          />
                        ) : (
                          verb.hebrew
                        )}
                      </TableCell>
                      <TableCell dir="rtl">
                        {editingId === verb.id ? (
                          <Input
                            value={editPast}
                            onChange={(e) => setEditPast(e.target.value)}
                            dir="rtl"
                            className="h-8"
                          />
                        ) : (
                          verb.past
                        )}
                      </TableCell>
                      <TableCell dir="rtl">
                        {editingId === verb.id ? (
                          <Input
                            value={editPresent}
                            onChange={(e) => setEditPresent(e.target.value)}
                            dir="rtl"
                            className="h-8"
                          />
                        ) : (
                          verb.present
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {editingId === verb.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveEdit(verb.id)}
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
                                onClick={() => handleStartEdit(verb)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteVerb(verb.id)}
                                disabled={deletingId === verb.id}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                {deletingId === verb.id ? (
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