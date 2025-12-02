import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Gift } from "lucide-react";
import { format } from "date-fns";

interface GiveawayCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  prizeValue?: number;
  endDate: string;
  entriesCount?: number;
  hasJoined?: boolean;
  onView?: (id: string) => void;
}

export const GiveawayCard = ({
  id,
  title,
  description,
  imageUrl,
  prizeValue,
  endDate,
  entriesCount = 0,
  hasJoined = false,
  onView,
}: GiveawayCardProps) => {
  return (
    <div
      className="relative rounded-xl p-[1.5px] overflow-hidden group hover:shadow-glow transition-all duration-300 w-full cursor-pointer"
      onClick={() => onView && onView(id)}
    >
      {/* Animated Border Layer */}
      <div
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
        style={{
          background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--primary)))",
        }}
      />

      {/* Card Content */}
      <Card className="relative z-10 w-full h-full flex flex-col transition-all duration-300 overflow-hidden">
        {/* Image Section */}
        <div className="aspect-video w-full overflow-hidden bg-muted relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src =
                  "https://placehold.co/400x225/A0A0A0/FFFFFF?text=Giveaway";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Gift className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}

          {/* Joined Badge */}
          {hasJoined && (
            <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground">
              Joined
            </Badge>
          )}
        </div>

        {/* Details Section */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title and Prize */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="line-clamp-2 text-base sm:text-lg font-semibold text-foreground leading-tight">
              {title}
            </h2>
            {prizeValue !== undefined && (
              <Badge variant="secondary" className="shrink-0 text-xs py-1">
                ${prizeValue}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
            {description}
          </p>

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-destructive" />
              <span className="font-medium text-destructive">
                {format(new Date(endDate), "MMM dd")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{entriesCount} entries</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
