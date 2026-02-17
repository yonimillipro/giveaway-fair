import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
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

      setPromotions(data || []);
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
        <div className="flex justify-center sm:justify-start gap-3">
          <Skeleton className="h-44 w-[calc(100vw-32px)] max-w-[320px] sm:w-64 flex-shrink-0 rounded-xl" />
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

        {/* Scroll container - single card centered on mobile, multiple on larger screens */}
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-1 sm:justify-start px-[calc((100vw-85%)/2)] sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {promotions.map((promotion) => (
            <Card 
              key={promotion.id} 
              className="promotion-card flex-shrink-0 w-[85vw] sm:w-[280px] md:w-[320px] overflow-hidden cursor-pointer snap-center sm:snap-start rounded-xl border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98] bg-transparent"
              onClick={() => navigate(`/promotion/${promotion.id}`)}
            >
              {/* Image Section - Image only, no text overlays */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted rounded-xl">
                {promotion.product_image_url ? (
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
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <Package className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                )}

                {/* Floating discount badge - only badge on the image */}
                <Badge 
                  className="absolute top-2.5 right-2.5 bg-destructive text-destructive-foreground font-bold text-sm px-2.5 py-1 shadow-lg"
                >
                  {promotion.discount_percentage}% OFF
                </Badge>
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
