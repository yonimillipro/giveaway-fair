import { Gift, Trophy, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const FilterTabs = ({ activeTab, onTabChange }: FilterTabsProps) => {
  const tabs = [
    { id: "all-giveaways", label: "All", fullLabel: "Giveaways", icon: Gift },
    { id: "my-entries", label: "Entries", fullLabel: "My Entries", icon: Trophy },
    { id: "my-wins", label: "Wins", fullLabel: "My Wins", icon: Award },
  ];

  return (
    <div className="inline-flex items-center p-1 bg-muted/80 backdrop-blur-sm rounded-lg mb-4 sm:mb-6 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200",
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{tab.fullLabel}</span>
          <span className="sm:hidden">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
