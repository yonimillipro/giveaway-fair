import { Gift, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const FilterTabs = ({ activeTab, onTabChange }: FilterTabsProps) => {
  const tabs = [
    { id: "all-giveaways", label: "All", fullLabel: "Giveaways", icon: Gift },
    { id: "my-entries", label: "Entries", fullLabel: "My Entries", icon: Trophy },
  ];

  return (
    <div className="inline-flex items-center p-1 bg-muted rounded-lg mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <tab.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{tab.fullLabel}</span>
          <span className="sm:hidden">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};