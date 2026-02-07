import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface FollowState {
  isFollowing: boolean;
  followerCount: number;
  loading: boolean;
}

interface CompanyFollowContextType {
  getFollowState: (companyId: string) => FollowState;
  initializeCompany: (companyId: string) => Promise<void>;
  toggleFollow: (companyId: string) => Promise<void>;
}

const CompanyFollowContext = createContext<CompanyFollowContextType | null>(null);

export const useCompanyFollowContext = () => {
  const context = useContext(CompanyFollowContext);
  if (!context) {
    throw new Error("useCompanyFollowContext must be used within CompanyFollowProvider");
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const CompanyFollowProvider = ({ children }: Props) => {
  const { user, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [followStates, setFollowStates] = useState<Record<string, FollowState>>({});

  const getFollowState = useCallback((companyId: string): FollowState => {
    return followStates[companyId] || { isFollowing: false, followerCount: 0, loading: true };
  }, [followStates]);

  const initializeCompany = useCallback(async (companyId: string) => {
    if (!companyId) return;
    
    // Skip if already initialized and not loading
    if (followStates[companyId] && !followStates[companyId].loading) return;

    try {
      const { data: countData } = await supabase
        .rpc('get_company_follower_count', { company_uuid: companyId });

      let isFollowing = false;
      if (user) {
        const { data: followData } = await supabase
          .rpc('user_follows_company', { company_uuid: companyId });
        isFollowing = !!followData;
      }

      setFollowStates(prev => ({
        ...prev,
        [companyId]: {
          isFollowing,
          followerCount: countData || 0,
          loading: false,
        }
      }));
    } catch (error) {
      console.error("Error initializing company follow:", error);
      setFollowStates(prev => ({
        ...prev,
        [companyId]: { isFollowing: false, followerCount: 0, loading: false }
      }));
    }
  }, [user, followStates]);

  const toggleFollow = useCallback(async (companyId: string) => {
    if (!user) {
      toast.info("Please sign in to follow companies");
      navigate("/auth");
      return;
    }

    if (!isEmailVerified) {
      toast.error("Please verify your email before following companies");
      return;
    }

    const currentState = followStates[companyId];
    if (!currentState || currentState.loading) return;

    // Optimistic update
    setFollowStates(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        isFollowing: !currentState.isFollowing,
        followerCount: currentState.isFollowing 
          ? Math.max(0, currentState.followerCount - 1)
          : currentState.followerCount + 1,
      }
    }));

    try {
      if (currentState.isFollowing) {
        const { error } = await supabase
          .from("company_follows")
          .delete()
          .eq("user_id", user.id)
          .eq("company_id", companyId);

        if (error) throw error;
        toast.success("Unfollowed company");
      } else {
        const { error } = await supabase
          .from("company_follows")
          .insert({ user_id: user.id, company_id: companyId });

        if (error) {
          if (error.code === "23505") {
            // Already following - just update state
            setFollowStates(prev => ({
              ...prev,
              [companyId]: { ...prev[companyId], isFollowing: true }
            }));
            return;
          }
          throw error;
        }
        toast.success("Now following this company!");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
      // Revert optimistic update
      setFollowStates(prev => ({
        ...prev,
        [companyId]: currentState
      }));
    }
  }, [user, isEmailVerified, followStates, navigate]);

  return (
    <CompanyFollowContext.Provider value={{ getFollowState, initializeCompany, toggleFollow }}>
      {children}
    </CompanyFollowContext.Provider>
  );
};
