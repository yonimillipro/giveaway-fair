import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Gift,
  CheckCircle,
  Eye,
  Share2,
  Heart,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface GiveawayDetail {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  prize_value: number | null;
  end_date: string;
  start_date: string;
  max_entries: number | null;
  status: string;
  company_id: string;
}

const GiveawayDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [giveaway, setGiveaway] = useState<GiveawayDetail | null>(null);
  const [entriesCount, setEntriesCount] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchGiveawayDetails();
    }
  }, [id, user]);

  const fetchGiveawayDetails = async () => {
    try {
      // Fetch giveaway
      const { data: giveawayData, error: giveawayError } = await supabase
        .from("giveaways")
        .select("*")
        .eq("id", id)
        .single();

      if (giveawayError) throw giveawayError;
      setGiveaway(giveawayData);

      // Fetch entries count
      const { count } = await supabase
        .from("giveaway_entries")
        .select("*", { count: "exact", head: true })
        .eq("giveaway_id", id);

      setEntriesCount(count || 0);

      // Check if user has joined
      if (user) {
        const { data: entryData } = await supabase
          .from("giveaway_entries")
          .select("id")
          .eq("giveaway_id", id)
          .eq("user_id", user.id)
          .single();

        setHasJoined(!!entryData);
      }
    } catch (error) {
      console.error("Error fetching giveaway:", error);
      toast.error("Failed to load giveaway details");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      toast.info("Please sign in to join this giveaway");
      navigate("/auth");
      return;
    }

    if (!giveaway) return;

    setJoining(true);
    try {
      const { error } = await supabase
        .from("giveaway_entries")
        .insert({ user_id: user.id, giveaway_id: giveaway.id });

      if (error) {
        if (error.code === "23505") {
          toast.info("You have already joined this giveaway");
        } else {
          throw error;
        }
      } else {
        toast.success("Successfully joined the giveaway!");
        setHasJoined(true);
        setEntriesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error joining giveaway:", error);
      toast.error("Failed to join giveaway");
    } finally {
      setJoining(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: giveaway?.title,
        text: giveaway?.description,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-96 bg-muted rounded-xl" />
            <div className="h-6 bg-muted rounded w-3/4" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!giveaway) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Giveaway Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This giveaway may have ended or doesn't exist.
          </p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isEnded = new Date(giveaway.end_date) < new Date();
  const timeRemaining = formatDistanceToNow(new Date(giveaway.end_date), {
    addSuffix: true,
  });

  // Mock multiple images for gallery effect (using the same image)
  const images = giveaway.image_url
    ? [giveaway.image_url]
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Back Button */}
        <div className="container mx-auto px-4 pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                {images.length > 0 ? (
                  <img
                    src={images[currentImageIndex]}
                    alt={giveaway.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src =
                        "https://placehold.co/600x600/A0A0A0/FFFFFF?text=Giveaway";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gift className="w-24 h-24 text-muted-foreground/30" />
                  </div>
                )}

                {/* Image Counter */}
                {images.length > 0 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                    {currentImageIndex + 1}/{images.length}
                  </div>
                )}

                {/* View Count */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{entriesCount * 3 + 34} views</span>
                </div>

                {/* Posted Time */}
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                  Posted {format(new Date(giveaway.start_date), "MMM dd")}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        currentImageIndex === index
                          ? "border-primary"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Price Badge */}
              {giveaway.prize_value && (
                <div className="flex items-center gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-primary">
                    ${giveaway.prize_value.toLocaleString()}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    Prize Value
                  </span>
                  <button className="ml-auto p-2 hover:bg-muted rounded-full transition-colors">
                    <Heart className="w-6 h-6" />
                  </button>
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {giveaway.title}
              </h1>

              {/* Description */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {giveaway.description}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Entries</span>
                  </div>
                  <p className="text-xl font-bold">{entriesCount}</p>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {isEnded ? "Ended" : "Time Left"}
                    </span>
                  </div>
                  <p
                    className={`text-xl font-bold ${isEnded ? "text-destructive" : ""}`}
                  >
                    {isEnded ? "Ended" : timeRemaining}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 col-span-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">End Date</span>
                  </div>
                  <p className="text-xl font-bold">
                    {format(new Date(giveaway.end_date), "MMMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant={isEnded ? "destructive" : "secondary"}
                  className="text-sm py-1 px-3"
                >
                  {isEnded ? "Ended" : giveaway.status}
                </Badge>
                {hasJoined && (
                  <Badge
                    variant="outline"
                    className="text-sm py-1 px-3 border-primary text-primary"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Joined
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {hasJoined ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="flex-1"
                    disabled
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Already Joined
                  </Button>
                ) : isEnded ? (
                  <Button size="lg" variant="secondary" className="flex-1" disabled>
                    Giveaway Ended
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="flex-1 shadow-glow"
                    onClick={handleJoin}
                    disabled={joining}
                  >
                    {joining ? "Joining..." : "Join Giveaway"}
                  </Button>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleShare}
                  className="sm:w-auto"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>

              {/* Additional Info */}
              {giveaway.max_entries && (
                <p className="text-sm text-muted-foreground">
                  Maximum {giveaway.max_entries} entries allowed
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GiveawayDetail;
