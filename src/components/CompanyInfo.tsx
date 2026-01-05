import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CompanyFollowButton } from "./CompanyFollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Youtube, Instagram, Twitter, ExternalLink, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// TikTok icon component (reusable)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

interface CompanyInfoProps {
  companyId: string;
  showFollowButton?: boolean;
  size?: "sm" | "md" | "lg";
}

interface CompanyProfile {
  full_name: string | null;
  logo_url: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
}

export const CompanyInfo = ({
  companyId,
  showFollowButton = true,
  size = "md",
}: CompanyInfoProps) => {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyInfo();
  }, [companyId]);

  const fetchCompanyInfo = async () => {
    try {
      // Use edge function to fetch company info (bypasses RLS)
      const { data, error } = await supabase.functions.invoke("get-company-info", {
        body: { companyId },
      });

      if (error) {
        console.error("Error fetching company info:", error);
        return;
      }

      setCompany(data.company);
      setFollowerCount(data.followerCount || 0);
    } catch (error) {
      console.error("Error fetching company info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-3">
        <div className="w-12 h-12 bg-muted rounded-full" />
        <div className="h-4 bg-muted rounded w-24" />
      </div>
    );
  }

  if (!company) {
    return null;
  }

  const hasSocialLinks = company.youtube_url || company.instagram_url || company.twitter_url || company.tiktok_url;

  const avatarSizeClass = size === "lg" ? "w-16 h-16" : size === "md" ? "w-12 h-12" : "w-10 h-10";
  const nameSizeClass = size === "lg" ? "text-lg" : size === "md" ? "text-base" : "text-sm";

  return (
    <div className="space-y-4">
      {/* Company Header */}
      <div className="flex items-center gap-3">
        <Avatar className={avatarSizeClass}>
          <AvatarImage src={company.logo_url || undefined} alt={company.full_name || "Company"} />
          <AvatarFallback>
            <Building2 className="w-1/2 h-1/2 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${nameSizeClass} truncate`}>
            {company.full_name || "Company"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {followerCount} {followerCount === 1 ? "follower" : "followers"}
          </p>
        </div>
        {showFollowButton && (
          <CompanyFollowButton 
            companyId={companyId} 
            size="sm"
            onFollowChange={() => {
              // Refresh follower count
              supabase.rpc('get_company_follower_count', { company_uuid: companyId })
                .then(({ data }) => setFollowerCount(data || 0));
            }}
          />
        )}
      </div>

      {/* Social Links */}
      {hasSocialLinks && (
        <div className="flex flex-wrap gap-2">
          {company.youtube_url && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(company.youtube_url!, '_blank')}
            >
              <Youtube className="w-4 h-4 text-red-500" />
              YouTube
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
          {company.instagram_url && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(company.instagram_url!, '_blank')}
            >
              <Instagram className="w-4 h-4 text-pink-500" />
              Instagram
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
          {company.twitter_url && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(company.twitter_url!, '_blank')}
            >
              <Twitter className="w-4 h-4 text-sky-500" />
              X
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
          {company.tiktok_url && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(company.tiktok_url!, '_blank')}
            >
              <TikTokIcon className="w-4 h-4" />
              TikTok
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};