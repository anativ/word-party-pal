import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const WordManager = () => {
  const [english, setEnglish] = useState("");
  const [hebrew, setHebrew] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (error) {
      console.error("Error adding word:", error);
      toast.error("Failed to add word");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Add New Word</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <Button
          onClick={handleAddWord}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Word
        </Button>
      </CardContent>
    </Card>
  );
};
