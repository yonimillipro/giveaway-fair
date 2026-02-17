import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Gift, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user) {
        setAvatarUrl(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setAvatarUrl(data?.avatar_url || null);
    };
    fetchAvatar();
  }, [user]);

  const getNavLinks = () => {
    const links: { name: string; path: string }[] = [];

    if (user) {
      if (userRole === "admin") {
        links.push({ name: "Admin Dashboard", path: "/admin" });
      } else if (userRole === "company") {
        links.push({ name: "Company Dashboard", path: "/company" });
      } else {
        links.push({ name: "My Dashboard", path: "/dashboard" });
      }
    }

    return links;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = getNavLinks();

  if (location.pathname === "/auth") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-primary shadow-glow/50 transition-transform group-hover:scale-105">
              <Gift className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Giveaway
              </span>
              <span className="text-foreground">Hub</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant="ghost"
                onClick={() => navigate(link.path)}
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith(link.path)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
              </Button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

          {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/profile")}
                  className="rounded-full p-0.5"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                size="sm"
                className="hidden sm:flex shadow-glow/30"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button - hidden on home page */}
            {location.pathname !== "/" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl animate-fade-in">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  variant="ghost"
                  onClick={() => {
                    navigate(link.path);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full justify-start ${
                    location.pathname.startsWith(link.path)
                      ? "bg-primary/10 text-primary"
                      : ""
                  }`}
                >
                  {link.name}
                </Button>
              ))}

              <div className="pt-3 border-t border-border/40 space-y-2">
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate("/profile");
                        setIsMenuOpen(false);
                      }}
                      className="w-full justify-start gap-2"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                          {user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      Profile
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="w-full justify-start gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      navigate("/auth");
                      setIsMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
