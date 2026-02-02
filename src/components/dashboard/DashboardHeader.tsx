import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { DashboardHamburgerMenu } from "@/components/DashboardHamburgerMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

interface DashboardHeaderProps {
  avatarUrl: string | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardHeader = ({
  avatarUrl,
  activeTab,
  onTabChange,
}: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="bg-card border-b shadow-md">
      <div className="container mx-auto px-3 sm:px-4 py-3 flex justify-between items-center">
        {/* Left: Title */}
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
          Dashboard
        </h1>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell */}
          <NotificationBell />

          {/* Avatar - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className="rounded-full p-0.5 h-9 w-9 hidden sm:flex"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || undefined} alt="Profile" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>

          {/* Sign Out - Hidden on mobile */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="hidden md:flex h-9 px-3 text-sm gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>

          {/* Hamburger Menu */}
          <DashboardHamburgerMenu
            activeTab={activeTab}
            onTabChange={onTabChange}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </header>
  );
};