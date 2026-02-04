import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Gift, ArrowLeft, Ticket } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";

const Status = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEntries: 0,
    activeGiveaways: 0,
    wins: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      // Fetch user's entries count
      const { count: entriesCount } = await supabase
        .from("giveaway_entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch active giveaways the user hasn't joined
      const { data: allGiveaways } = await supabase
        .from("giveaways")
        .select("id")
        .eq("status", "active");

      const { data: userEntries } = await supabase
        .from("giveaway_entries")
        .select("giveaway_id")
        .eq("user_id", user.id);

      const joinedIds = new Set(userEntries?.map((e) => e.giveaway_id) || []);
      const activeCount = allGiveaways?.filter((g) => !joinedIds.has(g.id)).length || 0;

      // Fetch wins count
      const { count: winsCount } = await supabase
        .from("winners")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats({
        totalEntries: entriesCount || 0,
        activeGiveaways: activeCount,
        wins: winsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">My Status</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-4">
          {/* Entries Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Entries
              </CardTitle>
              <Ticket className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold">{stats.totalEntries}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Giveaways you've entered
              </p>
            </CardContent>
          </Card>

          {/* Active Giveaways Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Giveaways
              </CardTitle>
              <Gift className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold">{stats.activeGiveaways}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Available to enter
              </p>
            </CardContent>
          </Card>

          {/* Wins Card */}
          <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Wins
              </CardTitle>
              <Trophy className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.wins}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Giveaways you've won
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate("/dashboard")}
          >
            <Gift className="h-4 w-4 mr-2" />
            Browse Giveaways
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate("/profile")}
          >
            <Trophy className="h-4 w-4 mr-2" />
            View Profile
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Status;
