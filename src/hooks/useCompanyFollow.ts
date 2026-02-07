import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface UseCompanyFollowOptions {
  onFollowChange?: (isFollowing: boolean) => void;
}

export const useCompanyFollow = (companyId: string, options: UseCompanyFollowOptions = {}) => {
  const { user, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchFollowStatus = useCallback(async () => {
    if (!companyId) return;
    
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
  }, [companyId, user]);

  useEffect(() => {
    fetchFollowStatus();
  }, [fetchFollowStatus]);

  const toggleFollow = useCallback(async () => {
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
        options.onFollowChange?.(false);
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
          options.onFollowChange?.(true);
          toast.success("Now following this company!");
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  }, [user, isEmailVerified, isFollowing, companyId, navigate, options]);

  return {
    isFollowing,
    followerCount,
    loading,
    initialLoading,
    toggleFollow,
    refetch: fetchFollowStatus,
  };
};
