import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, X } from "lucide-react";
import { toast } from "sonner";

export const EmailVerificationBanner = () => {
  const { user, isEmailVerified, resendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if no user, email is verified, or dismissed
  if (!user || isEmailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      const { error } = await resendVerificationEmail();
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verification email sent! Please check your inbox.");
      }
    } catch (error) {
      toast.error("Failed to send verification email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-500/10 border-amber-500/20">
      <Mail className="h-4 w-4 text-amber-500" />
      <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm">
          <strong>Please verify your email to participate in giveaways.</strong>
          {" "}Check your inbox for a verification link.
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResend}
            disabled={sending}
          >
            {sending ? "Sending..." : "Resend Email"}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
