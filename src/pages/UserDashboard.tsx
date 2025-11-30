import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GiveawayCard } from "@/components/GiveawayCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Trophy, Users, Gift } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Giveaway {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  prize_value: number | null;
  end_date: string;
  entries_count?: number;
  has_joined?: boolean;
}

const UserDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [myEntries, setMyEntries] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGiveaways();
      fetchMyEntries();
    } else {
      // Clear state when user logs out or is undefined
      setGiveaways([]);
      setMyEntries([]);
      setLoading(false);
    }
  }, [user]);

  const fetchGiveaways = async () => {
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

          return {
            ...giveaway,
            entries_count: count || 0,
            has_joined: !!entryData,
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

  const fetchMyEntries = async () => {
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
        const entries =
          (data || []).map((entry: any) => ({
            ...entry.giveaways,
            has_joined: true,
          })) ?? [];
        setMyEntries(entries);
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    }
  };

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
        if ((error as any).code === "23505") {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">User Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">
              Welcome, {user?.email || "User"}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Entries
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEntries}</div>
              <p className="text-xs text-muted-foreground">
                Your total participation count
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Giveaways
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeGiveaways}</div>
              <p className="text-xs text-muted-foreground">
                Available to join now
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Wins (Mock)
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Check your email for win notifications
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all-giveaways" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="all-giveaways">All Giveaways</TabsTrigger>
            <TabsTrigger value="my-entries">My Entries</TabsTrigger>
          </TabsList>

          <TabsContent value="all-giveaways" className="space-y-6 mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading giveaways...</p>
              </div>
            ) : giveaways.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No active giveaways to display.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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
                    onJoin={handleJoinGiveaway}
                    onView={handleGiveawayView}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-entries" className="space-y-6 mt-6">
            {myEntries.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  You haven't joined any giveaways yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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
