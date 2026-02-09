import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, 
  X, 
  Gift, 
  Trophy,
  BarChart3,
  Users, 
  User, 
  HelpCircle,
  Info,
  Mail,
  Briefcase,
  Shield,
  FileText,
  Cookie,
  Send,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface DashboardHamburgerMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut?: () => void;
}

export const DashboardHamburgerMenu = ({ activeTab, onTabChange, onSignOut }: DashboardHamburgerMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardLinks = [
    { name: "Giveaways", icon: Gift, tab: "all-giveaways" },
    { name: "My Entries", icon: Trophy, tab: "my-entries" },
    { name: "My Wins", icon: Trophy, tab: "my-wins" },
  ];

  const extraPages = [
    { name: "All Winners", href: "/winners", icon: Trophy },
  ];

  const productLinks = [
    { name: "Promotions", href: "/promotions", icon: Gift },
    { name: "How it Works", href: "/how-it-works", icon: HelpCircle },
    { name: "FAQ", href: "/faq", icon: HelpCircle },
  ];

  const companyLinks = [
    { name: "About Us", href: "/about", icon: Info },
    { name: "Contact", href: "/contact", icon: Mail },
    { name: "Careers", href: "/careers", icon: Briefcase },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy", icon: Shield },
    { name: "Terms of Service", href: "/terms", icon: FileText },
    { name: "Cookie Policy", href: "/cookies", icon: Cookie },
  ];

  const userLinks = [
    { name: "Profile / Settings", href: "/profile", icon: User },
    { name: "My Status", href: "/status", icon: BarChart3 },
  ];

  const handleSignOut = () => {
    setOpen(false);
    onSignOut?.();
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  const handleTabSwitch = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        
        {/* Dashboard Navigation */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
            Dashboard
          </p>
          {dashboardLinks.map((item) => (
            <button
              key={item.tab}
              onClick={() => handleTabSwitch(item.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === item.tab
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </button>
          ))}
        </div>

        {/* Extra Pages */}
        <div className="space-y-1 mt-1">
          {extraPages.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </button>
          ))}
        </div>

        <Separator className="my-4" />

        {/* User Links */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
            Account
          </p>
          {userLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </button>
          ))}
          {onSignOut && (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          )}
        </div>

        <Separator className="my-4" />

        {/* Community Link */}
        <div className="px-2 mb-4">
          <a
            href="https://t.me/GiveawayHubCommunity"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[hsl(200,80%,50%)]/10 hover:bg-[hsl(200,80%,50%)]/20 border border-[hsl(200,80%,50%)]/20 transition-colors"
            onClick={() => setOpen(false)}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[hsl(200,80%,50%)] text-white">
              <Send className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">User Community</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-2.5 h-2.5" />
                Join on Telegram
              </span>
            </div>
          </a>
        </div>

        <Separator className="my-4" />

        {/* Product Links */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
            Product
          </p>
          {productLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </button>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Company Links */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
            Company
          </p>
          {companyLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </button>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Legal Links */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
            Legal
          </p>
          {legalLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
