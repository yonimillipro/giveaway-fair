import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface SocialShareButtonProps {
  title?: string;
  description?: string;
  url?: string;
}

export const SocialShareButton = ({ title, description, url }: SocialShareButtonProps) => {
  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/80 hover:bg-muted text-foreground transition-all duration-200 active:scale-95 touch-manipulation"
      aria-label="Share"
    >
      <Share2 className="w-5 h-5" />
      <span className="text-sm font-medium">Share</span>
    </button>
  );
};
