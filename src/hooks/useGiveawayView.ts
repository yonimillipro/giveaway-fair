import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Generate a session ID for anonymous users
const getSessionId = (): string => {
  const key = 'giveaway_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
};

export const useGiveawayView = (giveawayId: string) => {
  const { user } = useAuth();

  const trackView = useCallback(async () => {
    if (!giveawayId) return;

    try {
      if (user) {
        // For authenticated users, track by user_id
        const { data: hasViewed } = await supabase
          .rpc('user_has_viewed_giveaway', { giveaway_uuid: giveawayId });

        if (!hasViewed) {
          await supabase
            .from('giveaway_views')
            .insert({
              giveaway_id: giveawayId,
              user_id: user.id,
              session_id: null,
            });
        }
      } else {
        // For anonymous users, track by session_id
        const sessionId = getSessionId();
        
        // Check if session has already viewed
        const { data: existingView } = await supabase
          .from('giveaway_views')
          .select('id')
          .eq('giveaway_id', giveawayId)
          .eq('session_id', sessionId)
          .maybeSingle();

        if (!existingView) {
          await supabase
            .from('giveaway_views')
            .insert({
              giveaway_id: giveawayId,
              user_id: null,
              session_id: sessionId,
            });
        }
      }
    } catch (error: unknown) {
      // Silently handle duplicate key errors (constraint violations)
      const dbError = error as { code?: string };
      if (dbError?.code !== '23505') {
        console.error('Error tracking view:', error);
      }
    }
  }, [giveawayId, user]);

  useEffect(() => {
    trackView();
  }, [trackView]);
};
