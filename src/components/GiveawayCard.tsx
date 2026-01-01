import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, Gift, Heart, Building2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface GiveawayCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  images?: string[];
  prizeValue?: number;
  endDate: string;
  entriesCount?: number;
  hasJoined?: boolean;
  companyLogo?: string;
  companyName?: string;
  onView?: (id: string) => void;
}

export const GiveawayCard = ({
  id,
  title,
  description,
  imageUrl,
  images = [],
  prizeValue,
  endDate,
  entriesCount = 0,
  hasJoined = false,
  companyLogo,
  companyName,
  onView,
}: GiveawayCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);

  // Combine images array with fallback to single imageUrl
  const allImages = images.length > 0 ? images : (imageUrl ? [imageUrl] : []);

  useEffect(() => {
    fetchLikes();
  }, [id, user]);

  const fetchLikes = async () => {
    try {
      // Use secure RPC function to get like count without exposing user_ids
      const { data: countData } = await supabase
        .rpc('get_giveaway_like_count', { giveaway_uuid: id });

      setLikesCount(countData || 0);

      if (user) {
        // Use secure RPC function to check if user has liked
        const { data: hasLikedData } = await supabase
          .rpc('user_has_liked_giveaway', { giveaway_uuid: id });

        setHasLiked(!!hasLikedData);
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.info("Please sign in to like this giveaway");
      navigate("/auth");
      return;
    }

    if (likingInProgress) return;

    setLikingInProgress(true);
    try {
      if (hasLiked) {
        const { error } = await supabase
          .from("giveaway_likes")
          .delete()
          .eq("giveaway_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        setHasLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from("giveaway_likes")
          .insert({ user_id: user.id, giveaway_id: id });

        if (error) {
          if (error.code === "23505") {
            setHasLiked(true);
          } else {
            throw error;
          }
        } else {
          setHasLiked(true);
          setLikesCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleClick = () => {
    if (onView) {
      onView(id);
    } else {
      navigate(`/giveaway/${id}`);
    }
  };

  return (
    <div
      className="relative rounded-xl p-[1.5px] overflow-hidden group hover:shadow-glow transition-all duration-300 w-full cursor-pointer"
      onClick={handleClick}
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
        {/* Image Section with Carousel */}
        <div className="aspect-[4/3] sm:aspect-video w-full overflow-hidden bg-muted relative">
          {allImages.length > 0 ? (
            <Carousel className="w-full h-full" opts={{ loop: true }}>
              <CarouselContent className="h-full">
                {allImages.map((img, index) => (
                  <CarouselItem key={index} className="h-full">
                    <img
                      src={img}
                      alt={`${title} - ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src =
                          "https://placehold.co/400x225/A0A0A0/FFFFFF?text=Giveaway";
                      }}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Gift className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/50" />
            </div>
          )}

          {/* Image count indicator */}
          {allImages.length > 1 && (
            <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium z-10">
              {allImages.length} photos
            </div>
          )}

          {/* Joined Badge */}
          {hasJoined && (
            <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-primary/90 text-primary-foreground z-10 text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">
              Joined
            </Badge>
          )}

          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={likingInProgress}
            className={`absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-0.5 sm:gap-1 bg-background/80 backdrop-blur-sm px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-full text-[10px] sm:text-sm z-10 transition-colors hover:bg-background ${hasLiked ? 'text-red-500' : 'text-foreground'}`}
          >
            <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${hasLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{likesCount}</span>
          </button>
        </div>

        {/* Details Section */}
        <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
          {/* Title and Prize */}
          <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <h2 className="line-clamp-2 text-xs sm:text-base md:text-lg font-semibold text-foreground leading-tight">
              {title}
            </h2>
            {prizeValue !== undefined && (
              <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs py-0.5 px-1.5 sm:py-1 sm:px-2">
                ${prizeValue}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3 flex-1">
            {description}
          </p>

          {/* Info Row */}
          <div className="flex flex-wrap items-center justify-between gap-x-2 sm:gap-x-4 gap-y-1 text-[10px] sm:text-sm text-muted-foreground pt-2 border-t border-border/50">
            {/* Company Logo - Left */}
            <Avatar className="h-6 w-6 sm:h-9 sm:w-9 border sm:border-2 border-border">
              <AvatarImage src={companyLogo} alt={companyName || "Company"} />
              <AvatarFallback className="bg-muted text-muted-foreground text-[8px] sm:text-xs">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </AvatarFallback>
            </Avatar>
            
            {/* Date and Entries - Right */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-destructive" />
                <span className="font-medium text-destructive">
                  {format(new Date(endDate), "MMM dd")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{entriesCount}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};