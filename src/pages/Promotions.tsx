import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Tag, Package, ArrowLeft } from 'lucide-react';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface PromotionWithProducts extends Promotion {
  products: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  }>;
}

const Promotions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<PromotionWithProducts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data: promotionsData, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch products for each promotion
      const promotionsWithProducts = await Promise.all(
        (promotionsData || []).map(async (promo) => {
          const { data: promoProducts } = await supabase
            .from('promotion_products')
            .select(`
              product_id,
              products (
                id,
                name,
                price,
                image_url
              )
            `)
            .eq('promotion_id', promo.id);

          return {
            ...promo,
            products: (promoProducts || []).map((pp: any) => pp.products).filter(Boolean),
          };
        })
      );

      setPromotions(promotionsWithProducts);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountedPrice = (price: number, discount: number) => {
    return (price * (1 - discount / 100)).toFixed(2);
  };

  const isPromotionActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">Promotions & Deals</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading promotions...</p>
          </div>
        ) : promotions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active promotions at the moment.</p>
              <p className="text-sm text-muted-foreground mt-2">Check back later for amazing deals!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {promotions.map((promotion) => (
              <Card key={promotion.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-primary text-primary-foreground">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{promotion.name}</CardTitle>
                      {promotion.description && (
                        <p className="text-sm opacity-90">{promotion.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {promotion.discount_percentage}% OFF
                    </Badge>
                  </div>
                  <div className="text-sm opacity-75 mt-4">
                    Valid: {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {promotion.products.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No products in this promotion yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {promotion.products.map((product) => (
                        <Card key={product.id} className="overflow-hidden">
                          {product.image_url && (
                            <div className="aspect-video w-full overflow-hidden">
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2">{product.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-lg line-through text-muted-foreground">
                                ${product.price.toFixed(2)}
                              </span>
                              <span className="text-2xl font-bold text-primary">
                                ${calculateDiscountedPrice(product.price, promotion.discount_percentage)}
                              </span>
                            </div>
                            <Badge 
                              variant={isPromotionActive(promotion.start_date, promotion.end_date) ? "default" : "secondary"}
                              className="mt-2"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              Save ${(product.price * (promotion.discount_percentage / 100)).toFixed(2)}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!user && (
          <div className="text-center mt-8">
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                Sign up to get exclusive access to all promotions!
              </p>
              <Button onClick={() => navigate('/auth')}>
                Sign Up Now
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Promotions;