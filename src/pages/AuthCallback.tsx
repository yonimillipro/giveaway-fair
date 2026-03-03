import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("OAuth callback error:", sessionError);
          setError("Authentication failed. Please try again.");
          setTimeout(() => navigate("/auth"), 2000);
          return;
        }

        if (!session) {
          // Wait briefly for session to populate
          await new Promise((r) => setTimeout(r, 1000));
          const { data: retryData } = await supabase.auth.getSession();
          if (!retryData.session) {
            if (!cancelled) {
              setError("No session found. Redirecting to sign in...");
              setTimeout(() => navigate("/auth"), 1500);
            }
            return;
          }
          if (cancelled) return;
          await redirectByRole(retryData.session.user.id);
          return;
        }

        if (cancelled) return;
        await redirectByRole(session.user.id);
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        if (!cancelled) {
          setError("Something went wrong. Redirecting...");
          setTimeout(() => navigate("/auth"), 2000);
        }
      }
    };

    const redirectByRole = async (userId: string) => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      const role = data?.role || "user";
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "company") {
        navigate("/company", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    };

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Signing you in...</p>
        </>
      )}
    </div>
  );
};

export default AuthCallback;
