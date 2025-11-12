import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [wordOrder, setWordOrder] = useState("random_priority_least_seen");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("dark_mode, word_order")
        .eq("id", user.id)
        .single();

      if (profile) {
        setWordOrder(profile.word_order || "random_priority_least_seen");
        
        // Sync with theme provider
        setTheme(profile.dark_mode ? "dark" : "light");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDarkModeToggle = async (checked: boolean) => {
    if (!userId) return;

    // Update theme provider
    setTheme(checked ? "dark" : "light");

    try {
      await supabase
        .from("profiles")
        .update({ dark_mode: checked })
        .eq("id", userId);

      toast({
        title: "Settings updated",
        description: `Dark mode ${checked ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      console.error("Error updating dark mode:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handleWordOrderChange = async (value: string) => {
    if (!userId) return;

    setWordOrder(value);

    try {
      await supabase
        .from("profiles")
        .update({ word_order: value })
        .eq("id", userId);

      toast({
        title: "Settings updated",
        description: "Word order preference saved",
      });
    } catch (error) {
      console.error("Error updating word order:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Game
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8">Settings</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Word Selection</CardTitle>
              <CardDescription>Choose how words are selected for practice</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={wordOrder} onValueChange={handleWordOrderChange}>
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="random" id="random" />
                  <Label htmlFor="random" className="font-normal">
                    Random - Pick any word randomly
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="least_seen" id="least_seen" />
                  <Label htmlFor="least_seen" className="font-normal">
                    Least Seen - Always pick the least practiced word
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="random_priority_least_seen" id="random_priority_least_seen" />
                  <Label htmlFor="random_priority_least_seen" className="font-normal">
                    Smart Random - Random selection with priority to less practiced words
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
