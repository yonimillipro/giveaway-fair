import { GiveawayCard } from "@/components/GiveawayCard";
import { Gift, Trophy, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Giveaway {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  prize_value: number | null;
  end_date: string;
  company_id: string;
  entries_count?: number;
  has_joined?: boolean;
  company_logo?: string;
  company_name?: string;
  views_count?: number;
}

interface GiveawayGridProps {
  giveaways: Giveaway[];
  loading: boolean;
  emptyMessage: string;
  emptyIcon: "gift" | "trophy" | "award";
  onView: (id: string) => void;
}

export const GiveawayGrid = ({
  giveaways,
  loading,
  emptyMessage,
  emptyIcon,
  onView,
}: GiveawayGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl overflow-hidden bg-card shadow-sm">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              <Skeleton className="h-4 sm:h-5 w-3/4" />
              <Skeleton className="h-3 sm:h-4 w-full" />
              <Skeleton className="h-3 w-2/3 hidden sm:block" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (giveaways.length === 0) {
    const iconMap = {
      gift: Gift,
      trophy: Trophy,
      award: Award,
    };
    const Icon = iconMap[emptyIcon];
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-muted mb-4">
          <Icon className="w-7 h-7 sm:w-10 sm:h-10 text-muted-foreground" />
        </div>
        <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto px-4">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {giveaways.map((giveaway) => (
        <GiveawayCard
          key={giveaway.id}
          id={giveaway.id}
          title={giveaway.title}
          description={giveaway.description}
          imageUrl={giveaway.image_url || undefined}
          prizeValue={giveaway.prize_value || undefined}
          endDate={giveaway.end_date}
          entriesCount={giveaway.entries_count}
          hasJoined={giveaway.has_joined}
          companyLogo={giveaway.company_logo}
          companyName={giveaway.company_name}
          viewsCount={giveaway.views_count}
          onView={onView}
        />
      ))}
    </div>
  );
};
