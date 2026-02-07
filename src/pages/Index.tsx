import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GiveawayCard } from "@/components/GiveawayCard";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Trophy, Users, Tag, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-image.jpg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Giveaway {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  prize_value: number | null;
  end_date: string;
  company_id: string;
  entries_count?: number;
  images?: string[];
  company_logo?: string;
  company_name?: string;
}

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  status: string;
}

const Index = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotionsLoading, setPromotionsLoading] = useState(true);

  useEffect(() => {
    fetchGiveaways();
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      // Only select public fields, excluding created_by for security
      const { data, error } = await supabase
        .from('promotions')
        .select('id, name, description, discount_percentage, start_date, end_date, status')
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(3);

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setPromotionsLoading(false);
    }
  };

  const fetchGiveaways = async () => {
    try {
      const { data, error } = await supabase
        .from("giveaways")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      const giveawaysWithDetails = await Promise.all(
        (data || []).map(async (giveaway) => {
          // Use secure RPC function to get entry count (bypasses RLS)
          const { data: entriesCount } = await supabase
            .rpc('get_giveaway_entry_count', { giveaway_uuid: giveaway.id });

          // Fetch images for this giveaway
          const { data: imagesData } = await supabase
            .from("giveaway_images")
            .select("image_url")
            .eq("giveaway_id", giveaway.id)
            .order("display_order", { ascending: true });

          const images = imagesData?.map((img) => img.image_url) || [];

          // Fetch company profile using edge function (bypasses RLS)
          let companyLogo: string | undefined;
          let companyName: string | undefined;
          try {
            const { data: companyData } = await supabase.functions.invoke("get-company-info", {
              body: { companyId: giveaway.company_id },
            });
            companyLogo = companyData?.company?.logo_url || undefined;
            companyName = companyData?.company?.full_name || undefined;
          } catch (err) {
            console.error("Error fetching company info:", err);
          }

          return {
            ...giveaway,
            entries_count: entriesCount || 0,
            images,
            company_logo: companyLogo,
            company_name: companyName,
          };
        })
      );

      setGiveaways(giveawaysWithDetails);
    } catch (error) {
      console.error("Error fetching giveaways:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "company") {
        navigate("/company");
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-10">
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">Your Chance to Win Big</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Win Amazing Prizes Every Day
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Join exciting giveaways from top brands. Enter for free and win incredible prizes!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="text-lg shadow-glow">
                {user ? "Go to Dashboard" : "Get Started Free"}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/promotions")}>
                <Tag className="w-5 h-5 mr-2" />
                View Promotions
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4">
                <Gift className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-2">500+</h3>
              <p className="text-muted-foreground">Active Giveaways</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-secondary rounded-2xl mb-4">
                <Users className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-2">50K+</h3>
              <p className="text-muted-foreground">Happy Winners</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
                <Trophy className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-2">$2M+</h3>
              <p className="text-muted-foreground">Prizes Given</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Giveaways */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Giveaways</h2>
            <p className="text-lg text-muted-foreground">
              Join these popular giveaways before they end!
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading giveaways...</p>
            </div>
          ) : giveaways.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No active giveaways at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {giveaways.map((giveaway) => (
                <GiveawayCard
                  key={giveaway.id}
                  id={giveaway.id}
                  title={giveaway.title}
                  description={giveaway.description}
                  imageUrl={giveaway.image_url || undefined}
                  images={giveaway.images}
                  prizeValue={giveaway.prize_value || undefined}
                  endDate={giveaway.end_date}
                  entriesCount={giveaway.entries_count}
                  companyLogo={giveaway.company_logo}
                  companyName={giveaway.company_name}
                  onView={(id) => navigate(`/giveaway/${id}`)}
                />
              ))}
            </div>
          )}

          {!user && giveaways.length > 0 && (
            <div className="text-center mt-12">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Sign Up to Join Giveaways
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Promotions Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Current Promotions</h2>
              <p className="text-lg text-muted-foreground">
                Don't miss out on these amazing deals!
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/promotions")}>
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {promotionsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading promotions...</p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active promotions at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promotion) => (
                <Card key={promotion.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/promotions")}>
                  <CardHeader className="bg-gradient-primary text-primary-foreground p-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{promotion.name}</CardTitle>
                      <Badge variant="secondary" className="text-sm font-bold">
                        {promotion.discount_percentage}% OFF
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {promotion.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{promotion.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Tag className="w-3 h-3" />
                      <span>Valid until {new Date(promotion.end_date).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;