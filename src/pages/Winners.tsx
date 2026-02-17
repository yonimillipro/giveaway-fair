import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Trophy, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface WinnerEntry {
  id: string;
  selected_at: string;
  display_name: string | null;
  giveaway_title: string;
  giveaway_prize_value: number | null;
  company_name: string;
  company_logo: string | null;
}

const Winners = () => {
  const [winners, setWinners] = useState<WinnerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      // Fetch winners with giveaway join - winners table is publicly readable
      const { data: winnersData, error } = await supabase
        .from("winners")
        .select("id, selected_at, display_name, giveaway_id, giveaways(title, prize_value, company_id)")
        .order("selected_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Process to get company info via edge function (avoids RLS on profiles)
      const processed = await Promise.all(
        (winnersData || []).map(async (w: any) => {
          const giveaway = w.giveaways;

          let companyName = "Unknown Company";
          let companyLogo: string | null = null;
          if (giveaway?.company_id) {
            try {
              const { data: companyData } = await supabase.functions.invoke("get-company-info", {
                body: { companyId: giveaway.company_id },
              });
              companyName = companyData?.company?.full_name || "Unknown Company";
              companyLogo = companyData?.company?.logo_url || null;
            } catch {
              // ignore
            }
          }

          return {
            id: w.id,
            selected_at: w.selected_at,
            display_name: w.display_name,
            giveaway_title: giveaway?.title || "Unknown Giveaway",
            giveaway_prize_value: giveaway?.prize_value || null,
            company_name: companyName,
            company_logo: companyLogo,
          };
        })
      );

      setWinners(processed);
    } catch (error) {
      console.error("Error fetching winners:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">Verified Winners</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">All Winners</h1>
          <p className="text-muted-foreground">
            See who won our latest giveaways — transparency you can trust.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading winners...</p>
          </div>
        ) : winners.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No winners yet. Stay tuned!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {winners.map((winner) => (
              <Card key={winner.id} className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    {/* Company Logo */}
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={winner.company_logo || undefined} alt={winner.company_name} />
                      <AvatarFallback className="bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {winner.giveaway_title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        by {winner.company_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Trophy className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs sm:text-sm font-medium text-primary">
                          {winner.display_name || "Lucky Winner"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {format(new Date(winner.selected_at), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>

                    {/* Prize */}
                    {winner.giveaway_prize_value && (
                      <Badge variant="secondary" className="text-sm font-bold whitespace-nowrap">
                        ${winner.giveaway_prize_value}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Winners;
