import { useEffect } from "react";
import { useCompanyFollowContext } from "@/contexts/CompanyFollowContext";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";

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
  const { getFollowState, initializeCompany, toggleFollow } = useCompanyFollowContext();
  const state = getFollowState(companyId);

  useEffect(() => {
    initializeCompany(companyId);
  }, [companyId, initializeCompany]);

  const handleClick = async () => {
    const wasFollowing = state.isFollowing;
    await toggleFollow(companyId);
    // Notify parent of change
    onFollowChange?.(!wasFollowing);
  };

  if (state.loading) {
    return (
      <Button variant={variant} size={size} disabled>
        <UserPlus className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={state.isFollowing ? "secondary" : variant}
      size={size}
      onClick={handleClick}
    >
      {state.isFollowing ? (
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
      {showCount && <span className="ml-1">({state.followerCount})</span>}
    </Button>
  );
};
