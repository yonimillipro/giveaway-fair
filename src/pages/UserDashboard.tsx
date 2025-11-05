import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GiveawayCard } from '@/components/GiveawayCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Trophy } from 'lucide-react';

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
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [myEntries, setMyEntries] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGiveaways();
      fetchMyEntries();
    }
  }, [user]);

  const fetchGiveaways = async () => {
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const giveawaysWithDetails = await Promise.all(
        (data || []).map(async (giveaway) => {
          const { count } = await supabase
            .from('giveaway_entries')
            .select('*', { count: 'exact', head: true })
            .eq('giveaway_id', giveaway.id);

          const { data: entryData } = await supabase
            .from('giveaway_entries')
            .select('id')
            .eq('giveaway_id', giveaway.id)
            .eq('user_id', user?.id)
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
      console.error('Error fetching giveaways:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('giveaway_entries')
        .select(`
          giveaway_id,
          giveaways (
            id,
            title,
            description,
            image_url,
            prize_value,
            end_date
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const entries = (data || [])
        .map((entry: any) => entry.giveaways)
        .filter(Boolean);

      setMyEntries(entries);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const handleJoinGiveaway = async (giveawayId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('giveaway_entries')
        .insert({
          giveaway_id: giveawayId,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success('Successfully joined giveaway!');
      fetchGiveaways();
      fetchMyEntries();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You have already joined this giveaway');
      } else {
        toast.error('Failed to join giveaway');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">User Dashboard</h1>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="available">Available Giveaways</TabsTrigger>
            <TabsTrigger value="my-entries">My Entries</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading giveaways...</p>
            ) : giveaways.length === 0 ? (
              <p className="text-center text-muted-foreground">No active giveaways available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {giveaways.map((giveaway) => (
                  <GiveawayCard
                    key={giveaway.id}
                    {...giveaway}
                    imageUrl={giveaway.image_url || undefined}
                    prizeValue={giveaway.prize_value || undefined}
                    endDate={giveaway.end_date}
                    entriesCount={giveaway.entries_count}
                    hasJoined={giveaway.has_joined}
                    onJoin={handleJoinGiveaway}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-entries" className="space-y-6">
            {myEntries.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">You haven't joined any giveaways yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEntries.map((giveaway) => (
                  <GiveawayCard
                    key={giveaway.id}
                    {...giveaway}
                    imageUrl={giveaway.image_url || undefined}
                    prizeValue={giveaway.prize_value || undefined}
                    endDate={giveaway.end_date}
                    hasJoined={true}
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