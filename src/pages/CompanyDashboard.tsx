import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogOut, Plus, Users, Trophy } from 'lucide-react';
import { GiveawayCard } from '@/components/GiveawayCard';

interface Giveaway {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  prize_value: number | null;
  end_date: string;
  status: string;
  entries_count?: number;
}

const CompanyDashboard = () => {
  const { user, signOut } = useAuth();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    prize_value: '',
    end_date: '',
  });

  useEffect(() => {
    if (user) {
      fetchMyGiveaways();
    }
  }, [user]);

  const fetchMyGiveaways = async () => {
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .eq('company_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const giveawaysWithCounts = await Promise.all(
        (data || []).map(async (giveaway) => {
          const { count } = await supabase
            .from('giveaway_entries')
            .select('*', { count: 'exact', head: true })
            .eq('giveaway_id', giveaway.id);

          return {
            ...giveaway,
            entries_count: count || 0,
          };
        })
      );

      setGiveaways(giveawaysWithCounts);
    } catch (error) {
      console.error('Error fetching giveaways:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { error } = await supabase.from('giveaways').insert({
        company_id: user.id,
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url || null,
        prize_value: formData.prize_value ? parseFloat(formData.prize_value) : null,
        end_date: formData.end_date,
      });

      if (error) throw error;

      toast.success('Giveaway created successfully!');
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        prize_value: '',
        end_date: '',
      });
      fetchMyGiveaways();
    } catch (error) {
      toast.error('Failed to create giveaway');
      console.error(error);
    }
  };

  const handleSelectWinner = async (giveawayId: string) => {
    try {
      // Get all entries for this giveaway
      const { data: entries, error: entriesError } = await supabase
        .from('giveaway_entries')
        .select('user_id')
        .eq('giveaway_id', giveawayId);

      if (entriesError) throw entriesError;

      if (!entries || entries.length === 0) {
        toast.error('No entries found for this giveaway');
        return;
      }

      // Select random winner
      const randomIndex = Math.floor(Math.random() * entries.length);
      const winner = entries[randomIndex];

      // Insert winner
      const { error: winnerError } = await supabase
        .from('winners')
        .insert({
          giveaway_id: giveawayId,
          user_id: winner.user_id,
        });

      if (winnerError) throw winnerError;

      // Update giveaway status
      await supabase
        .from('giveaways')
        .update({ status: 'ended' })
        .eq('id', giveawayId);

      toast.success('Winner selected successfully!');
      fetchMyGiveaways();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('A winner has already been selected for this giveaway');
      } else {
        toast.error('Failed to select winner');
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Company Dashboard</h1>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">My Giveaways</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Giveaway
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Giveaway</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGiveaway} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prize_value">Prize Value ($)</Label>
                  <Input
                    id="prize_value"
                    type="number"
                    step="0.01"
                    value={formData.prize_value}
                    onChange={(e) => setFormData({ ...formData, prize_value: e.target.value })}
                    placeholder="100.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Create Giveaway
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading giveaways...</p>
        ) : giveaways.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">You haven't created any giveaways yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {giveaways.map((giveaway) => (
              <Card key={giveaway.id} className="overflow-hidden">
                <GiveawayCard
                  {...giveaway}
                  imageUrl={giveaway.image_url || undefined}
                  prizeValue={giveaway.prize_value || undefined}
                  endDate={giveaway.end_date}
                  entriesCount={giveaway.entries_count}
                />
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Users className="w-4 h-4" />
                    <span>{giveaway.entries_count} entries</span>
                  </div>
                  {giveaway.status === 'active' && new Date(giveaway.end_date) < new Date() && (
                    <Button
                      className="w-full"
                      onClick={() => handleSelectWinner(giveaway.id)}
                    >
                      Select Winner
                    </Button>
                  )}
                  {giveaway.status === 'ended' && (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      Winner Selected
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CompanyDashboard;