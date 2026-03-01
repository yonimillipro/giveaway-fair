import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";

const CompanyStatus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalFollowers: 0,
  });

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const [likesRes, followersRes] = await Promise.all([
        supabase.rpc("get_company_likes_count", { company_uuid: user.id }),
        supabase.rpc("get_company_followers_count", { company_uuid: user.id }),
      ]);

      setStats({
        totalLikes: (likesRes.data as number) || 0,
        totalFollowers: (followersRes.data as number) || 0,
      });
    } catch (error) {
      console.error("Error fetching company stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/company")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Company Analytics</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Likes
              </CardTitle>
              <Heart className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold">{stats.totalLikes}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Unique users who liked your giveaways
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Followers
              </CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold">{stats.totalFollowers}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Unique users following your company
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate("/company")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CompanyStatus;
