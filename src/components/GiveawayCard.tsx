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
      const { data: countData } = await supabase
        .rpc('get_giveaway_like_count', { giveaway_uuid: id });

      setLikesCount(countData || 0);

      if (user) {
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
      className="relative rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
      onClick={handleClick}
    >
      <Card className="relative w-full h-full flex flex-col overflow-hidden shadow-md border-0 bg-card">
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {allImages.length > 0 ? (
            <Carousel className="w-full h-full" opts={{ loop: true }}>
              <CarouselContent className="h-full">
                {allImages.map((img, index) => (
                  <CarouselItem key={index} className="h-full">
                    <img
                      src={img}
                      alt={`${title} - ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "https://placehold.co/400x300/A0A0A0/FFFFFF?text=Giveaway";
                      }}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <Gift className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Gradient overlay for text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Image count indicator */}
          {allImages.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] text-white font-medium z-10">
              {allImages.length} photos
            </div>
          )}

          {/* Like Button - Heart overlay on image */}
          <button
            onClick={handleLike}
            disabled={likingInProgress}
            className={`absolute top-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1.5 rounded-full text-xs z-10 transition-all hover:bg-black/60 ${
              hasLiked ? 'text-red-400' : 'text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{likesCount}</span>
          </button>

          {/* Joined Badge */}
          {hasJoined && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground z-10 text-[10px] px-2 py-0.5 shadow-lg">
              Joined
            </Badge>
          )}

          {/* Prize badge overlay on image */}
          {prizeValue !== undefined && (
            <Badge 
              variant="secondary" 
              className="absolute bottom-2 left-2 bg-white/90 text-foreground font-bold text-xs px-2 py-1 shadow-lg z-10"
            >
              ${prizeValue}
            </Badge>
          )}
        </div>

        {/* Details Section */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Title */}
          <h2 className="line-clamp-2 text-sm sm:text-base font-semibold text-foreground leading-tight mb-1.5">
            {title}
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
            {description}
          </p>

          {/* Footer Row */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
            {/* Company Logo */}
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-border">
              <AvatarImage src={companyLogo} alt={companyName || "Company"} />
              <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                <Building2 className="h-3.5 w-3.5" />
              </AvatarFallback>
            </Avatar>
            
            {/* Date and Entries */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-destructive" />
                <span className="font-medium text-destructive">
                  {format(new Date(endDate), "MMM dd")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{entriesCount}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};