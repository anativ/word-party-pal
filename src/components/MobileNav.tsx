import { useState } from "react";
import { Menu, X, BookOpen, Shield, BarChart3, Settings, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileNavProps {
  mode: "quiz" | "admin";
  onModeChange: (mode: "quiz" | "admin") => void;
  onAdminClick: () => void;
  onStatsClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  userName: string;
}

export const MobileNav = ({
  mode,
  onModeChange,
  onAdminClick,
  onStatsClick,
  onSettingsClick,
  onLogout,
  onRefresh,
  userName,
}: MobileNavProps) => {
  const [open, setOpen] = useState(false);

  const handleNavClick = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          English Learning
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium hidden sm:inline">Hi, {userName}!</span>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </div>
      </div>

      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="pb-4 border-b">
            <p className="text-sm text-muted-foreground">Logged in as</p>
            <p className="font-medium">{userName}</p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => handleNavClick(() => onModeChange("quiz"))}
              variant={mode === "quiz" ? "default" : "outline"}
              className="w-full justify-start"
              size="lg"
            >
              <BookOpen className="mr-3 h-5 w-5" />
              Practice
            </Button>
            
            <Button
              onClick={() => handleNavClick(onAdminClick)}
              variant={mode === "admin" ? "default" : "outline"}
              className="w-full justify-start"
              size="lg"
            >
              <Shield className="mr-3 h-5 w-5" />
              Admin
            </Button>
            
            <Button
              onClick={() => handleNavClick(onStatsClick)}
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Stats
            </Button>
            
            <Button
              onClick={() => handleNavClick(onSettingsClick)}
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Button>
          </div>

          <div className="pt-4 border-t space-y-2">
            <Button
              onClick={() => handleNavClick(onRefresh)}
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <RefreshCw className="mr-3 h-4 w-4" />
              Refresh
            </Button>
            
            <Button
              onClick={() => handleNavClick(onLogout)}
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
