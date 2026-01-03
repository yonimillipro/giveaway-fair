import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CompanyFollowButtonProps {
  companyId: string;
  showCount?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
  onFollowChange?: (isFollowing: boolean) => void;
}

export const CompanyFollowButton = ({
  companyId,
  showCount = false,
  size = "default",
  variant = "outline",
  onFollowChange,
}: CompanyFollowButtonProps) => {
  const { user, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchFollowStatus();
  }, [companyId, user]);

  const fetchFollowStatus = async () => {
    try {
      // Get follower count using secure function
      const { data: countData } = await supabase
        .rpc('get_company_follower_count', { company_uuid: companyId });
      
      setFollowerCount(countData || 0);

      // Check if current user is following
      if (user) {
        const { data: followData } = await supabase
          .rpc('user_follows_company', { company_uuid: companyId });
        
        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error("Error fetching follow status:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      toast.info("Please sign in to follow companies");
      navigate("/auth");
      return;
    }

    // Prevent unverified users from following
    if (!isEmailVerified) {
      toast.error("Please verify your email before following companies");
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("company_follows")
          .delete()
          .eq("user_id", user.id)
          .eq("company_id", companyId);

        if (error) throw error;
        
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        onFollowChange?.(false);
        toast.success("Unfollowed company");
      } else {
        // Follow
        const { error } = await supabase
          .from("company_follows")
          .insert({ user_id: user.id, company_id: companyId });

        if (error) {
          if (error.code === "23505") {
            // Already following
            setIsFollowing(true);
          } else {
            throw error;
          }
        } else {
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
          onFollowChange?.(true);
          toast.success("Now following this company!");
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Button variant={variant} size={size} disabled>
        <UserPlus className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : variant}
      size={size}
      onClick={handleToggleFollow}
      disabled={loading}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </>
      )}
      {showCount && <span className="ml-1">({followerCount})</span>}
    </Button>
  );
};
