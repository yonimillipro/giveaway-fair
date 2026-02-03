import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tag, ChevronLeft, ChevronRight, Building2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  status: string;
  company_id: string | null;
  product_image_url: string | null;
  company_name?: string;
  company_logo?: string;
}

interface PromotionSliderProps {
  autoScrollInterval?: number;
}

export const PromotionSlider = ({ autoScrollInterval = 4000 }: PromotionSliderProps) => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (promotions.length > 1 && autoScrollInterval > 0) {
      startAutoScroll();
    }
    return () => stopAutoScroll();
  }, [promotions, autoScrollInterval]);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('id, name, description, discount_percentage, start_date, end_date, status, company_id, product_image_url')
        .eq('status', 'active')
        .order('start_date', { ascending: false });

      if (error) throw error;

      const promotionsWithCompany = await Promise.all(
        (data || []).map(async (promo) => {
          if (promo.company_id) {
            const { data: companyData } = await supabase
              .from('profiles')
              .select('full_name, logo_url')
              .eq('id', promo.company_id)
              .single();

            return {
              ...promo,
              company_name: companyData?.full_name || undefined,
              company_logo: companyData?.logo_url || undefined,
            };
          }
          return promo;
        })
      );

      setPromotions(promotionsWithCompany);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollRef.current = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const cardWidth = scrollRef.current.querySelector('.promotion-card')?.clientWidth || 280;
        
        if (scrollLeft >= maxScroll - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: cardWidth + 12, behavior: 'smooth' });
        }
      }
    }, autoScrollInterval);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.querySelector('.promotion-card')?.clientWidth || 280;
      const scrollAmount = direction === 'left' ? -(cardWidth + 12) : (cardWidth + 12);
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-44 w-full sm:w-64 flex-shrink-0 rounded-xl" />
          <Skeleton className="h-44 w-64 flex-shrink-0 rounded-xl hidden sm:block" />
        </div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  return (
    <div 
      className="px-3 sm:px-4 py-3 bg-transparent relative group"
      onMouseEnter={stopAutoScroll}
      onMouseLeave={() => promotions.length > 1 && startAutoScroll()}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-foreground">
          <Tag className="w-4 h-4 text-primary" />
          Active Promotions
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/promotions')}
          className="text-xs h-7 px-2"
        >
          View All
        </Button>
      </div>

      <div className="relative">
        {/* Left scroll button - visible on hover for desktop */}
        {promotions.length > 1 && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg h-8 w-8 -ml-2 hidden sm:flex"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Scroll container - single card on mobile, multiple on larger screens */}
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-1 -mx-3 px-3 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {promotions.map((promotion) => (
            <Card 
              key={promotion.id} 
              className="promotion-card flex-shrink-0 w-[calc(100vw-32px)] sm:w-[280px] md:w-[320px] overflow-hidden cursor-pointer snap-start rounded-xl border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98] bg-card/80 backdrop-blur-sm"
              onClick={() => navigate(`/promotion/${promotion.id}`)}
            >
              {/* Image with gradient overlay */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                {promotion.product_image_url ? (
                  <>
                    <img
                      src={promotion.product_image_url}
                      alt={promotion.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "https://placehold.co/320x200/A0A0A0/FFFFFF?text=Product";
                      }}
                    />
                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <Package className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                )}

                {/* Floating discount badge */}
                <Badge 
                  className="absolute top-2.5 right-2.5 bg-destructive text-destructive-foreground font-bold text-sm px-2.5 py-1 shadow-lg"
                >
                  {promotion.discount_percentage}% OFF
                </Badge>

                {/* Title overlay on image */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h3 className="text-white font-semibold text-base sm:text-lg line-clamp-1 drop-shadow-md">
                    {promotion.name}
                  </h3>
                  {promotion.description && (
                    <p className="text-white/80 text-xs sm:text-sm line-clamp-1 mt-0.5 drop-shadow-md">
                      {promotion.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div className="p-3 flex items-center justify-between bg-card/50 backdrop-blur-sm">
                {promotion.company_name && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-border">
                      <AvatarImage src={promotion.company_logo || undefined} alt={promotion.company_name} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                        <Building2 className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                      {promotion.company_name}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Until {new Date(promotion.end_date).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Right scroll button - visible on hover for desktop */}
        {promotions.length > 1 && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg h-8 w-8 -mr-2 hidden sm:flex"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
