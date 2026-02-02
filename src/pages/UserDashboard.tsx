import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PromotionSlider } from "@/components/dashboard/PromotionSlider";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { GiveawayGrid } from "@/components/dashboard/GiveawayGrid";

interface Giveaway {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  prize_value: number | null;
  end_date: string;
  company_id: string;
  entries_count?: number;
  has_joined?: boolean;
  company_logo?: string;
  company_name?: string;
}

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [myEntries, setMyEntries] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all-giveaways");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [winsCount, setWinsCount] = useState(0);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setAvatarUrl(data?.avatar_url || null);
    };
    fetchAvatar();
  }, [user]);

  useEffect(() => {
    const fetchWins = async () => {
      if (!user) return;
      const { count } = await supabase
        .from("winners")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setWinsCount(count || 0);
    };
    fetchWins();
  }, [user]);

  const fetchGiveaways = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("giveaways")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const giveawaysWithDetails = await Promise.all(
        (data || []).map(async (giveaway) => {
          const { count } = await supabase
            .from("giveaway_entries")
            .select("*", { count: "exact", head: true })
            .eq("giveaway_id", giveaway.id);

          const { data: entryData } = await supabase
            .from("giveaway_entries")
            .select("id")
            .eq("giveaway_id", giveaway.id)
            .eq("user_id", user?.id)
            .single();

          const { data: profileData } = await supabase
            .from("profiles")
            .select("logo_url, full_name")
            .eq("id", giveaway.company_id)
            .maybeSingle();

          return {
            ...giveaway,
            entries_count: count || 0,
            has_joined: !!entryData,
            company_logo: profileData?.logo_url || undefined,
            company_name: profileData?.full_name || undefined,
          };
        })
      );

      setGiveaways(giveawaysWithDetails);
    } catch (error) {
      console.error("Error fetching giveaways:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMyEntries = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("giveaway_entries")
        .select(
          `
          giveaways (
            id,
            title,
            description,
            image_url,
            prize_value,
            end_date
          )
        `
        )
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching my entries:", error);
      } else {
        interface GiveawayEntry {
          giveaways: {
            id: string;
            title: string;
            description: string;
            image_url: string | null;
            prize_value: number | null;
            end_date: string;
            company_id?: string;
          } | null;
        }
        const entries: Giveaway[] = (data || [])
          .filter((entry: GiveawayEntry) => entry.giveaways !== null)
          .map((entry: GiveawayEntry) => ({
            id: entry.giveaways!.id,
            title: entry.giveaways!.title,
            description: entry.giveaways!.description,
            image_url: entry.giveaways!.image_url,
            prize_value: entry.giveaways!.prize_value,
            end_date: entry.giveaways!.end_date,
            company_id: entry.giveaways!.company_id || "",
            has_joined: true,
          }));
        setMyEntries(entries);
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchGiveaways();
      fetchMyEntries();
    } else {
      setGiveaways([]);
      setMyEntries([]);
      setLoading(false);
    }
  }, [user, fetchGiveaways, fetchMyEntries]);

  const handleGiveawayView = (id: string) => {
    navigate(`/giveaway/${id}`);
  };

  const activeGiveaways = giveaways.filter((g) => !g.has_joined).length;
  const totalEntries = myEntries.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header + Promotion Banner */}
      <div className="sticky top-0 z-40 bg-background shadow-sm">
        <DashboardHeader
          avatarUrl={avatarUrl}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <PromotionSlider autoScrollInterval={4000} />
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl flex-1">
        {/* Stats Cards */}
        <StatsCards
          totalEntries={totalEntries}
          activeGiveaways={activeGiveaways}
          wins={winsCount}
          loading={loading}
        />

        {/* Filter Tabs */}
        <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="all-giveaways" className="mt-0">
            <GiveawayGrid
              giveaways={giveaways}
              loading={loading}
              emptyMessage="No active giveaways to display."
              emptyIcon="gift"
              onView={handleGiveawayView}
            />
          </TabsContent>

          <TabsContent value="my-entries" className="mt-0">
            <GiveawayGrid
              giveaways={myEntries}
              loading={false}
              emptyMessage="You haven't joined any giveaways yet."
              emptyIcon="trophy"
              onView={handleGiveawayView}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserDashboard;