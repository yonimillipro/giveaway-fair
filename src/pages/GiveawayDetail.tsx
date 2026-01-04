import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GiveawayRequirements } from "@/components/GiveawayRequirements";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { CompanyInfo } from "@/components/CompanyInfo";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
  Lock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";

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

interface GiveawayImage {
  id: string;
  image_url: string;
  display_order: number;
}

const GiveawayDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isEmailVerified } = useAuth();

  const [giveaway, setGiveaway] = useState<GiveawayDetail | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [entriesCount, setEntriesCount] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [allRequirementsMet, setAllRequirementsMet] = useState(false);

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

      // Fetch giveaway images
      const { data: imagesData } = await supabase
        .from("giveaway_images")
        .select("*")
        .eq("giveaway_id", id)
        .order("display_order", { ascending: true });

      // Build images array - use giveaway_images if available, otherwise fallback to image_url
      const imageUrls: string[] = [];
      if (imagesData && imagesData.length > 0) {
        imageUrls.push(...imagesData.map((img: GiveawayImage) => img.image_url));
      } else if (giveawayData.image_url) {
        imageUrls.push(giveawayData.image_url);
      }
      setImages(imageUrls);

      // Fetch entries count
      const { count } = await supabase
        .from("giveaway_entries")
        .select("*", { count: "exact", head: true })
        .eq("giveaway_id", id);

      setEntriesCount(count || 0);

      // Fetch likes count using secure RPC function
      const { data: likeCount } = await supabase
        .rpc('get_giveaway_like_count', { giveaway_uuid: id });

      setLikesCount(likeCount || 0);

      // Check if user has joined and liked
      if (user) {
        const { data: entryData } = await supabase
          .from("giveaway_entries")
          .select("id")
          .eq("giveaway_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        setHasJoined(!!entryData);

        // Use secure RPC function to check if user has liked
        const { data: hasLikedData } = await supabase
          .rpc('user_has_liked_giveaway', { giveaway_uuid: id });

        setHasLiked(!!hasLikedData);
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

    // Validate requirements on backend before joining
    setJoining(true);
    try {
      // Call backend validation function
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_giveaway_entry', {
          p_user_id: user.id,
          p_giveaway_id: giveaway.id,
          p_user_email_verified: isEmailVerified
        });

      if (validationError) throw validationError;

      const result = validationResult as { valid: boolean; errors: string[] } | null;
      if (!result?.valid) {
        const errors = result?.errors || ['Requirements not met'];
        toast.error(errors[0]);
        return;
      }

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

  const handleLike = async () => {
    if (!user) {
      toast.info("Please sign in to like this giveaway");
      navigate("/auth");
      return;
    }

    if (!giveaway || likingInProgress) return;

    setLikingInProgress(true);
    try {
      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from("giveaway_likes")
          .delete()
          .eq("giveaway_id", giveaway.id)
          .eq("user_id", user.id);

        if (error) throw error;
        setHasLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from("giveaway_likes")
          .insert({ user_id: user.id, giveaway_id: giveaway.id });

        if (error) {
          if (error.code === "23505") {
            setHasLiked(true);
          } else {
            throw error;
          }
        } else {
          setHasLiked(true);
          setLikesCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    } finally {
      setLikingInProgress(false);
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

  const handleBack = () => {
    // Check if there's history to go back to, otherwise go home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <EmailVerificationBanner />

      <main className="flex-1">
        {/* Back Button */}
        <div className="container mx-auto px-4 pt-4">
          <Button
            variant="ghost"
            onClick={handleBack}
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
              {/* Main Image Carousel */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                {images.length > 0 ? (
                  <Carousel className="w-full h-full">
                    <CarouselContent className="h-full">
                      {images.map((img, index) => (
                        <CarouselItem key={index} className="h-full">
                          <img
                            src={img}
                            alt={`${giveaway.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src =
                                "https://placehold.co/600x600/A0A0A0/FFFFFF?text=Giveaway";
                            }}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {images.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gift className="w-24 h-24 text-muted-foreground/30" />
                  </div>
                )}

                {/* View Count */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm z-10">
                  <Eye className="w-4 h-4" />
                  <span>{entriesCount * 3 + 34} views</span>
                </div>

                {/* Posted Time */}
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm z-10">
                  Posted {format(new Date(giveaway.start_date), "MMM dd")}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 border-transparent opacity-60 hover:opacity-100 transition-all"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Company Info with Follow Button - Below Image */}
              <div className="p-4 border rounded-xl bg-card">
                <CompanyInfo 
                  companyId={giveaway.company_id} 
                  showFollowButton={true}
                  showSocialLinks={false}
                  size="md"
                />
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Price Badge and Like */}
              <div className="flex items-center gap-3">
                {giveaway.prize_value && (
                  <>
                    <span className="text-3xl md:text-4xl font-bold text-primary">
                      ${giveaway.prize_value.toLocaleString()}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      Prize Value
                    </span>
                  </>
                )}
                <button 
                  onClick={handleLike}
                  disabled={likingInProgress}
                  className={`ml-auto p-2 hover:bg-muted rounded-full transition-colors flex items-center gap-1.5 ${hasLiked ? 'text-red-500' : ''}`}
                >
                  <Heart className={`w-6 h-6 ${hasLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{likesCount}</span>
                </button>
              </div>

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

              {/* Giveaway Requirements */}
              {!hasJoined && !isEnded && (
                <GiveawayRequirements
                  giveawayId={giveaway.id}
                  companyId={giveaway.company_id}
                  onAllRequirementsMet={setAllRequirementsMet}
                  disabled={joining}
                />
              )}

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
                ) : !allRequirementsMet ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="flex-1"
                    disabled
                  >
                    <Lock className="w-5 h-5 mr-2" />
                    Complete Requirements to Join
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