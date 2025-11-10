import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GiveawayCard } from '@/components/GiveawayCard';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Trophy, Users, Tag } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

interface Giveaway {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  prize_value: number | null;
  end_date: string;
  entries_count?: number;
}

const Index = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const fetchGiveaways = async () => {
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

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

  const handleGetStarted = () => {
    if (user) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'company') {
        navigate('/company');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen">
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
                {user ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/promotions')}>
                <Tag className="w-5 h-5 mr-2" />
                View Promotions
              </Button>
              {!user && (
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {giveaways.map((giveaway) => (
                <GiveawayCard
                  key={giveaway.id}
                  {...giveaway}
                  imageUrl={giveaway.image_url || undefined}
                  prizeValue={giveaway.prize_value || undefined}
                  endDate={giveaway.end_date}
                  entriesCount={giveaway.entries_count}
                  onView={() => user ? navigate('/dashboard') : navigate('/auth')}
                />
              ))}
            </div>
          )}
          
          {!user && giveaways.length > 0 && (
            <div className="text-center mt-12">
              <Button size="lg" onClick={() => navigate('/auth')}>
                Sign Up to Join Giveaways
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;