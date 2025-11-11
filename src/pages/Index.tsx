import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizGame } from "@/components/QuizGame";
import { AdminPanel } from "@/components/AdminPanel";
import { BookOpen, Shield } from "lucide-react";

const Index = () => {
  const [mode, setMode] = useState<"quiz" | "admin">("quiz");

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            English Learning
          </h1>
          <p className="text-muted-foreground">Practice Hebrew to English translations</p>
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
            onClick={() => setMode("admin")}
            variant={mode === "admin" ? "default" : "outline"}
            className="flex-1"
            size="lg"
          >
            <Shield className="mr-2 h-5 w-5" />
            Admin
          </Button>
        </div>

        {mode === "quiz" ? <QuizGame /> : <AdminPanel />}
      </div>
    </div>
  );
};

export default Index;
