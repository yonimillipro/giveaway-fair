import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface PromotionCarouselProps {
  autoScrollInterval?: number; // in milliseconds
}

export const PromotionCarousel = ({ autoScrollInterval = 4000 }: PromotionCarouselProps) => {
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
        .select('id, name, description, discount_percentage, start_date, end_date, status')
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
        
        if (scrollLeft >= maxScroll - 10) {
          // Reset to start
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll by one card width
          scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
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
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="animate-pulse h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  return (
    <div 
      className="mb-6 relative group"
      onMouseEnter={stopAutoScroll}
      onMouseLeave={() => promotions.length > 1 && startAutoScroll()}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          Active Promotions
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/promotions')}
          className="text-sm"
        >
          View All
        </Button>
      </div>

      <div className="relative">
        {/* Left scroll button */}
        {promotions.length > 1 && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg h-8 w-8"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Carousel container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {promotions.map((promotion) => (
            <Card 
              key={promotion.id} 
              className="flex-shrink-0 w-[280px] sm:w-[320px] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate("/promotions")}
            >
              <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm sm:text-base line-clamp-1">{promotion.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs sm:text-sm font-bold shrink-0">
                    {promotion.discount_percentage}% OFF
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                {promotion.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{promotion.description}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  <span>Valid until {new Date(promotion.end_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right scroll button */}
        {promotions.length > 1 && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg h-8 w-8"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};