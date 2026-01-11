import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GiveawayCard } from "@/components/GiveawayCard";
import { PromotionCarousel } from "@/components/PromotionCarousel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { LogOut, Trophy, Users, Gift, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  status: string;
}

const UserDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [myEntries, setMyEntries] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all-giveaways");
  const isMobile = useIsMobile();

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

          // Fetch company profile for logo
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

  const handleJoinGiveaway = async (giveawayId: string) => {
    if (!user) {
      toast.info("Please sign in to join a giveaway.");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from("giveaway_entries")
        .insert({ user_id: user.id, giveaway_id: giveawayId });

      if (error) {
        if (error.code === "23505") {
          toast.info("You have already joined this giveaway.");
        } else {
          toast.error("Failed to join giveaway. Please try again.");
          console.error("Error joining giveaway:", error);
        }
      } else {
        toast.success("Successfully joined the giveaway!");
        fetchGiveaways();
        fetchMyEntries();
      }
    } catch (error) {
      console.error("An unexpected error occurred during join:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleGiveawayView = (id: string) => {
    navigate(`/giveaway/${id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const activeGiveaways = giveaways.filter((g) => !g.has_joined).length;
  const totalEntries = myEntries.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold text-primary">Dashboard</h1>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground hidden sm:inline truncate max-w-[150px]">
              {user?.email || "User"}
            </span>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleSignOut} className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Promotion Carousel at the top */}
        <PromotionCarousel autoScrollInterval={4000} />

        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2.5 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">
                Entries
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{totalEntries}</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block">
                Your total participation
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2.5 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">
                Active
              </CardTitle>
              <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{activeGiveaways}</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block">
                Available to join
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2.5 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">
                Wins
              </CardTitle>
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">0</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block">
                Check email for wins
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile: Popup Menu */}
          {isMobile ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-10 mb-4">
                  <span className="flex items-center gap-2">
                    {activeTab === "all-giveaways" ? (
                      <>
                        <Gift className="h-4 w-4" />
                        Giveaways
                      </>
                    ) : (
                      <>
                        <Trophy className="h-4 w-4" />
                        My Entries
                      </>
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-1.5rem)] p-1" align="start">
                <Button
                  variant={activeTab === "all-giveaways" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("all-giveaways")}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Giveaways
                </Button>
                <Button
                  variant={activeTab === "my-entries" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("my-entries")}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  My Entries
                </Button>
              </PopoverContent>
            </Popover>
          ) : (
            /* Desktop: Regular Tabs */
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === "all-giveaways" ? "default" : "outline"}
                onClick={() => setActiveTab("all-giveaways")}
                className="flex items-center gap-2"
              >
                <Gift className="h-4 w-4" />
                Giveaways
              </Button>
              <Button
                variant={activeTab === "my-entries" ? "default" : "outline"}
                onClick={() => setActiveTab("my-entries")}
                className="flex items-center gap-2"
              >
                <Trophy className="h-4 w-4" />
                My Entries
              </Button>
            </div>
          )}

          <TabsContent value="all-giveaways" className="space-y-4 sm:space-y-6 mt-0">
            {loading ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-muted-foreground">Loading giveaways...</p>
              </div>
            ) : giveaways.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Gift className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  No active giveaways to display.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
                {giveaways.map((giveaway) => (
                  <GiveawayCard
                    key={giveaway.id}
                    id={giveaway.id}
                    title={giveaway.title}
                    description={giveaway.description}
                    imageUrl={giveaway.image_url || undefined}
                    prizeValue={giveaway.prize_value || undefined}
                    endDate={giveaway.end_date}
                    entriesCount={giveaway.entries_count}
                    hasJoined={giveaway.has_joined}
                    companyLogo={giveaway.company_logo}
                    companyName={giveaway.company_name}
                    onView={handleGiveawayView}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-entries" className="space-y-4 sm:space-y-6 mt-0">
            {myEntries.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  You haven't joined any giveaways yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
                {myEntries.map((giveaway) => (
                  <GiveawayCard
                    key={giveaway.id}
                    id={giveaway.id}
                    title={giveaway.title}
                    description={giveaway.description}
                    imageUrl={giveaway.image_url || undefined}
                    prizeValue={giveaway.prize_value || undefined}
                    endDate={giveaway.end_date}
                    hasJoined={true}
                    onView={handleGiveawayView}
                  />
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default UserDashboard;

// import { useEffect, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { GiveawayCard } from "@/components/GiveawayCard";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { LogOut, Trophy } from "lucide-react";
// import Promotions from "./Promotions";

// interface Giveaway {
//   id: string;
//   title: string;
//   description: string;
//   image_url: string | null;
//   prize_value: number | null;
//   end_date: string;
//   entries_count?: number;
//   has_joined?: boolean;
// }

// const UserDashboard = () => {
//   const { user, signOut } = useAuth();
//   const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
//   const [myEntries, setMyEntries] = useState<Giveaway[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (user) {
//       fetchGiveaways();
//       fetchMyEntries();
//     }
//   }, [user]);

//   const fetchGiveaways = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("giveaways")
//         .select("*")
//         .eq("status", "active")
//         .order("created_at", { ascending: false });

//       if (error) throw error;

//       const giveawaysWithDetails = await Promise.all(
//         (data || []).map(async (giveaway) => {
//           const { count } = await supabase
//             .from("giveaway_entries")
//             .select("*", { count: "exact", head: true })
//             .eq("giveaway_id", giveaway.id);

//           const { data: entryData } = await supabase
//             .from("giveaway_entries")
//             .select("id")
//             .eq("giveaway_id", giveaway.id)
//             .eq("user_id", user?.id)
//             .single();

//           return {
//             ...giveaway,
//             entries_count: count || 0,
//             has_joined: !!entryData,
//           };
//         })
//       );

//       setGiveaways(giveawaysWithDetails);
//     } catch (error) {
//       console.error("Error fetching giveaways:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchMyEntries = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("giveaway_entries")
//         .select(
//           `
//           giveaway_id,
//           giveaways (
//             id,
//             title,
//             description,
//             image_url,
//             prize_value,
//             end_date
//           )
//         `
//         )
//         .eq("user_id", user?.id);

//       if (error) throw error;

//       const entries = (data || [])
//         .map((entry: any) => entry.giveaways)
//         .filter(Boolean);

//       setMyEntries(entries);
//     } catch (error) {
//       console.error("Error fetching entries:", error);
//     }
//   };

//   const handleJoinGiveaway = async (giveawayId: string) => {
//     if (!user) return;

//     try {
//       const { error } = await supabase.from("giveaway_entries").insert({
//         giveaway_id: giveawayId,
//         user_id: user.id,
//       });

//       if (error) throw error;

//       toast.success("Successfully joined giveaway!");
//       fetchGiveaways();
//       fetchMyEntries();
//     } catch (error: any) {
//       if (error.code === "23505") {
//         toast.error("You have already joined this giveaway");
//       } else {
//         toast.error("Failed to join giveaway");
//       }
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold">User Dashboard</h1>
//             <Button variant="outline" onClick={signOut}>
//               <LogOut className="w-4 h-4 mr-2" />
//               Sign Out
//             </Button>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-4 py-8">
//         <Tabs defaultValue="available" className="w-full">
//           <TabsList className="mb-8">
//             <TabsTrigger value="available">Available Giveaways</TabsTrigger>
//             <TabsTrigger value="my-entries">My Entries</TabsTrigger>
//           </TabsList>

//           <TabsContent value="available" className="space-y-6">
//             {loading ? (
//               <p className="text-center text-muted-foreground">
//                 Loading giveaways...
//               </p>
//             ) : giveaways.length === 0 ? (
//               <p className="text-center text-muted-foreground">
//                 No active giveaways available.
//               </p>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {giveaways.map((giveaway) => (
//                   <GiveawayCard
//                     key={giveaway.id}
//                     {...giveaway}
//                     imageUrl={giveaway.image_url || undefined}
//                     prizeValue={giveaway.prize_value || undefined}
//                     endDate={giveaway.end_date}
//                     entriesCount={giveaway.entries_count}
//                     hasJoined={giveaway.has_joined}
//                     onJoin={handleJoinGiveaway}
//                   />
//                 ))}
//               </div>
//             )}
//           </TabsContent>
//           {/* <Promotions /> */}
//           <TabsContent value="my-entries" className="space-y-6">
//             {myEntries.length === 0 ? (
//               <div className="text-center py-12">
//                 <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
//                 <p className="text-muted-foreground">
//                   You haven't joined any giveaways yet.
//                 </p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {myEntries.map((giveaway) => (
//                   <GiveawayCard
//                     key={giveaway.id}
//                     {...giveaway}
//                     imageUrl={giveaway.image_url || undefined}
//                     prizeValue={giveaway.prize_value || undefined}
//                     endDate={giveaway.end_date}
//                     hasJoined={true}
//                   />
//                 ))}
//               </div>
//             )}
//           </TabsContent>
//         </Tabs>
//       </main>
//     </div>
//   );
// };

// export default UserDashboard;
