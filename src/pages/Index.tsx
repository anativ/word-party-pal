import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QuizGame } from "@/components/QuizGame";
import { AdminPanel } from "@/components/AdminPanel";
import { AdminPasswordDialog } from "@/components/AdminPasswordDialog";
import { BookOpen, Shield, LogOut, BarChart3, Settings, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [mode, setMode] = useState<"quiz" | "admin">("quiz");
  const [userName, setUserName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      setUserName(profile.name);
    }

    // Check if user has admin role
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!adminRole);
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      setMode("admin");
    } else {
      setShowAdminDialog(true);
    }
  };

  const handleAdminAccessGranted = () => {
    setIsAdmin(true);
    setMode("admin");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              English Learning
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Hi, {userName}!</span>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-center">Practice Hebrew to English translations</p>
        </header>

        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setMode("quiz")}
            variant={mode === "quiz" ? "default" : "outline"}
            className="flex-1"
            size="lg"
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Practice
          </Button>
          <Button
            onClick={handleAdminClick}
            variant={mode === "admin" ? "default" : "outline"}
            className="flex-1"
            size="lg"
          >
            <Shield className="mr-2 h-5 w-5" />
            Admin
          </Button>
          <Button
            onClick={() => navigate("/stats")}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            Stats
          </Button>
        </div>

        {mode === "quiz" ? <QuizGame /> : <AdminPanel />}

        <AdminPasswordDialog
          open={showAdminDialog}
          onOpenChange={setShowAdminDialog}
          onSuccess={handleAdminAccessGranted}
        />
      </div>
    </div>
  );
};

export default Index;
