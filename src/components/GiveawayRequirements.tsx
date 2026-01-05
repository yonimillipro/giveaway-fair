import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyFollowButton } from "./CompanyFollowButton";
import { 
  CheckCircle, 
  Circle, 
  Mail, 
  UserPlus, 
  Youtube, 
  Instagram, 
  Twitter,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

interface GiveawayRequirementsProps {
  giveawayId: string;
  companyId: string;
  onAllRequirementsMet: (met: boolean) => void;
  disabled?: boolean;
}

interface Requirements {
  require_email_verified: boolean;
  require_company_follow: boolean;
  require_youtube: boolean;
  require_instagram: boolean;
  require_twitter: boolean;
  require_tiktok: boolean;
}

interface CompanyProfile {
  youtube_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  full_name?: string;
}

interface TaskCompletion {
  task_type: string;
}

export const GiveawayRequirements = ({
  giveawayId,
  companyId,
  onAllRequirementsMet,
  disabled = false,
}: GiveawayRequirementsProps) => {
  const { user, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  
  const [requirements, setRequirements] = useState<Requirements>({
    require_email_verified: true,
    require_company_follow: true,
    require_youtube: false,
    require_instagram: false,
    require_twitter: false,
    require_tiktok: false,
  });
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [giveawayId, companyId, user]);

  useEffect(() => {
    checkAllRequirements();
  }, [requirements, isEmailVerified, isFollowing, completedTasks]);

  const fetchData = async () => {
    try {
      // Fetch requirements
      const { data: reqData } = await supabase
        .from("giveaway_requirements")
        .select("*")
        .eq("giveaway_id", giveawayId)
        .maybeSingle();

      if (reqData) {
        setRequirements(reqData);
      }

      // Fetch company profile for social links using edge function (bypasses RLS)
      const { data: companyData, error: companyError } = await supabase.functions.invoke("get-company-info", {
        body: { companyId },
      });

      if (!companyError && companyData?.company) {
        setCompanyProfile(companyData.company);
      }

      // Check follow status
      if (user) {
        const { data: followData } = await supabase
          .rpc('user_follows_company', { company_uuid: companyId });
        
        setIsFollowing(!!followData);

        // Fetch completed tasks
        const { data: tasksData } = await supabase
          .from("user_task_completions")
          .select("task_type")
          .eq("user_id", user.id)
          .eq("giveaway_id", giveawayId);

        if (tasksData) {
          setCompletedTasks(new Set(tasksData.map((t: TaskCompletion) => t.task_type)));
        }
      }
    } catch (error) {
      console.error("Error fetching requirements:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllRequirements = () => {
    if (!user) {
      onAllRequirementsMet(false);
      return;
    }

    const emailOk = !requirements.require_email_verified || isEmailVerified;
    const followOk = !requirements.require_company_follow || isFollowing;
    const youtubeOk = !requirements.require_youtube || completedTasks.has('youtube');
    const instagramOk = !requirements.require_instagram || completedTasks.has('instagram');
    const twitterOk = !requirements.require_twitter || completedTasks.has('twitter');
    const tiktokOk = !requirements.require_tiktok || completedTasks.has('tiktok');

    onAllRequirementsMet(emailOk && followOk && youtubeOk && instagramOk && twitterOk && tiktokOk);
  };

  const handleTaskComplete = async (taskType: string, url?: string) => {
    if (!user) {
      toast.info("Please sign in to complete tasks");
      navigate("/auth");
      return;
    }

    // Open the social link first
    if (url) {
      window.open(url, '_blank');
    }

    // Mark task as complete in database
    try {
      const { error } = await supabase
        .from("user_task_completions")
        .insert({
          user_id: user.id,
          giveaway_id: giveawayId,
          task_type: taskType,
        });

      if (error && error.code !== "23505") {
        throw error;
      }

      setCompletedTasks(prev => new Set([...prev, taskType]));
      toast.success("Task marked as complete!");
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Failed to mark task complete");
    }
  };

  const handleFollowChange = (following: boolean) => {
    setIsFollowing(following);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyRequirements = 
    requirements.require_email_verified ||
    requirements.require_company_follow ||
    requirements.require_youtube ||
    requirements.require_instagram ||
    requirements.require_twitter ||
    requirements.require_tiktok;

  if (!hasAnyRequirements) {
    return null;
  }

  const renderCheckIcon = (completed: boolean) => {
    return completed ? (
      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
    ) : (
      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          To join this giveaway, complete the steps below:
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning about false confirmations */}
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <span className="text-muted-foreground">
            <strong>False confirmations may result in disqualification.</strong>
          </span>
        </div>

        {/* Email Verification */}
        {requirements.require_email_verified && (
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {renderCheckIcon(isEmailVerified)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Verify your email</span>
              </div>
              {!isEmailVerified && (
                <p className="text-sm text-muted-foreground mt-1">
                  Please verify your email to participate in giveaways.
                </p>
              )}
            </div>
            {isEmailVerified && (
              <Badge variant="secondary" className="text-green-600">Verified</Badge>
            )}
          </div>
        )}

        {/* Company Follow */}
        {requirements.require_company_follow && (
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {renderCheckIcon(isFollowing)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  Follow {companyProfile?.full_name || "this company"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Follow this company to stay updated on future giveaways.
              </p>
            </div>
            <CompanyFollowButton 
              companyId={companyId} 
              size="sm"
              onFollowChange={handleFollowChange}
            />
          </div>
        )}

        {/* YouTube Task */}
        {requirements.require_youtube && companyProfile?.youtube_url && (
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {renderCheckIcon(completedTasks.has('youtube'))}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="font-medium">Subscribe on YouTube</span>
              </div>
            </div>
            {!completedTasks.has('youtube') ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleTaskComplete('youtube', companyProfile.youtube_url)}
                disabled={disabled}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Subscribe
              </Button>
            ) : (
              <Badge variant="secondary" className="text-green-600">Done</Badge>
            )}
          </div>
        )}

        {/* Instagram Task */}
        {requirements.require_instagram && companyProfile?.instagram_url && (
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {renderCheckIcon(completedTasks.has('instagram'))}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" />
                <span className="font-medium">Follow on Instagram</span>
              </div>
            </div>
            {!completedTasks.has('instagram') ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleTaskComplete('instagram', companyProfile.instagram_url)}
                disabled={disabled}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Follow
              </Button>
            ) : (
              <Badge variant="secondary" className="text-green-600">Done</Badge>
            )}
          </div>
        )}

        {/* Twitter Task */}
        {requirements.require_twitter && companyProfile?.twitter_url && (
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {renderCheckIcon(completedTasks.has('twitter'))}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Twitter className="w-4 h-4 text-sky-500" />
                <span className="font-medium">Follow on X (Twitter)</span>
              </div>
            </div>
            {!completedTasks.has('twitter') ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleTaskComplete('twitter', companyProfile.twitter_url)}
                disabled={disabled}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Follow
              </Button>
            ) : (
              <Badge variant="secondary" className="text-green-600">Done</Badge>
            )}
          </div>
        )}

        {/* TikTok Task */}
        {requirements.require_tiktok && companyProfile?.tiktok_url && (
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {renderCheckIcon(completedTasks.has('tiktok'))}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <TikTokIcon className="w-4 h-4" />
                <span className="font-medium">Follow on TikTok</span>
              </div>
            </div>
            {!completedTasks.has('tiktok') ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleTaskComplete('tiktok', companyProfile.tiktok_url)}
                disabled={disabled}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Follow
              </Button>
            ) : (
              <Badge variant="secondary" className="text-green-600">Done</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
