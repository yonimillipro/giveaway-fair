import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Building2, Calendar, Package, Tag, Share2, Link, Twitter, Facebook, Linkedin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyFollowButton } from "@/components/CompanyFollowButton";
import { toast } from "sonner";

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

interface CompanyProfile {
  full_name: string | null;
  logo_url: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

const PromotionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPromotionDetails();
    }
  }, [id]);

  const fetchPromotionDetails = async () => {
    try {
      // Fetch promotion
      const { data: promoData, error: promoError } = await supabase
        .from("promotions")
        .select("*")
        .eq("id", id)
        .single();

      if (promoError) throw promoError;
      setPromotion(promoData);

      // Fetch company profile if company_id exists
      if (promoData.company_id) {
        const { data: companyData } = await supabase
          .from("profiles")
          .select("full_name, logo_url")
          .eq("id", promoData.company_id)
          .single();

        setCompany(companyData);
      }

      // Fetch products linked to this promotion
      const { data: promotionProducts } = await supabase
        .from("promotion_products")
        .select("product_id")
        .eq("promotion_id", id);

      if (promotionProducts && promotionProducts.length > 0) {
        const productIds = promotionProducts.map((pp) => pp.product_id);
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, description, price, image_url")
          .in("id", productIds);

        setProducts(productsData || []);
      }
    } catch (error) {
      console.error("Error fetching promotion details:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountedPrice = (price: number, discount: number) => {
    return (price * (1 - discount / 100)).toFixed(2);
  };

  const isPromotionActive = () => {
    if (!promotion) return false;
    const now = new Date();
    const start = new Date(promotion.start_date);
    const end = new Date(promotion.end_date);
    return now >= start && now <= end && promotion.status === "active";
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = promotion ? `Check out this promotion: ${promotion.name} - ${promotion.discount_percentage}% OFF!` : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-24 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Promotion Not Found</h1>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
            {promotion.product_image_url ? (
              <img
                src={promotion.product_image_url}
                alt={promotion.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src =
                    "https://placehold.co/640x360/A0A0A0/FFFFFF?text=Product";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Promotion Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge
                variant={isPromotionActive() ? "default" : "secondary"}
                className="text-lg px-4 py-1"
              >
                {promotion.discount_percentage}% OFF
              </Badge>
              {!isPromotionActive() && (
                <Badge variant="outline" className="text-muted-foreground">
                  Expired
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold">{promotion.name}</h1>

            {promotion.description && (
              <p className="text-muted-foreground">{promotion.description}</p>
            )}

            {/* Valid Dates */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Valid from {new Date(promotion.start_date).toLocaleDateString()}{" "}
                to {new Date(promotion.end_date).toLocaleDateString()}
              </span>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                Share:
              </span>
              <Button variant="outline" size="icon" onClick={handleShareTwitter} title="Share on X/Twitter">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShareFacebook} title="Share on Facebook">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShareLinkedIn} title="Share on LinkedIn">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopyLink} title="Copy link">
                <Link className="h-4 w-4" />
              </Button>
            </div>

            {/* Company Info */}
            {company && promotion.company_id && (
              <Card className="mt-4">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage
                        src={company.logo_url || undefined}
                        alt={company.full_name || "Company"}
                      />
                      <AvatarFallback className="bg-muted">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Offered by</p>
                      <p className="font-semibold">
                        {company.full_name || "Unknown Company"}
                      </p>
                    </div>
                  </div>
                  <CompanyFollowButton companyId={promotion.company_id} size="sm" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Products Section */}
        {products.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Products in this Promotion
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square w-full overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src =
                            "https://placehold.co/300x300/A0A0A0/FFFFFF?text=Product";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-muted-foreground line-through text-sm">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-primary font-bold text-lg">
                        $
                        {calculateDiscountedPrice(
                          product.price,
                          promotion.discount_percentage
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PromotionDetail;
