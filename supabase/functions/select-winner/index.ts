import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting winner selection process...');

    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find ended giveaways that haven't had a winner selected
    const { data: endedGiveaways, error: giveawayError } = await supabase
      .from('giveaways')
      .select('id, title, company_id, prize_value')
      .eq('winner_selected', false)
      .lt('end_date', new Date().toISOString());

    if (giveawayError) {
      console.error('Error fetching ended giveaways:', giveawayError);
      throw giveawayError;
    }

    console.log(`Found ${endedGiveaways?.length || 0} giveaways needing winner selection`);

    // Fetch all admin user IDs for notifications
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const adminIds = (adminRoles || []).map(r => r.user_id);
    console.log(`Found ${adminIds.length} admin(s) to notify`);

    const results: { giveaway_id: string; winner_id: string | null; status: string }[] = [];

    for (const giveaway of endedGiveaways || []) {
      console.log(`Processing giveaway: ${giveaway.id} - ${giveaway.title}`);

      // Select a random entry from giveaway_entries using ORDER BY RANDOM()
      // This is the ONLY fair way - pure SQL randomness
      const { data: randomEntry, error: entryError } = await supabase
        .from('giveaway_entries')
        .select('id, user_id')
        .eq('giveaway_id', giveaway.id)
        .order('random()')
        .limit(1)
        .single();

      if (entryError || !randomEntry) {
        console.log(`No entries found for giveaway ${giveaway.id}`);
        
        // Do NOT mark winner_selected if no entries
        // Notify company that giveaway ended with no entries
        if (giveaway.company_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: giveaway.company_id,
              title: '⚠️ Giveaway Ended - No Entries',
              message: `Your giveaway "${giveaway.title}" has ended with no entries. No winner was selected.`,
              is_read: false
            });
        }

        results.push({
          giveaway_id: giveaway.id,
          winner_id: null,
          status: 'no_entries'
        });
        continue;
      }

      console.log(`Selected winner entry: ${randomEntry.id} for user: ${randomEntry.user_id}`);

      // Mark the entry as winner
      const { error: updateEntryError } = await supabase
        .from('giveaway_entries')
        .update({ is_winner: true })
        .eq('id', randomEntry.id);

      if (updateEntryError) {
        console.error('Error marking entry as winner:', updateEntryError);
        throw updateEntryError;
      }

      // Mark the giveaway as winner_selected
      const { error: updateGiveawayError } = await supabase
        .from('giveaways')
        .update({ winner_selected: true })
        .eq('id', giveaway.id);

      if (updateGiveawayError) {
        console.error('Error updating giveaway:', updateGiveawayError);
        throw updateGiveawayError;
      }

      // Insert into winners table
      const { error: winnerError } = await supabase
        .from('winners')
        .insert({
          giveaway_id: giveaway.id,
          user_id: randomEntry.user_id,
          notified: true
        });

      if (winnerError) {
        console.error('Error inserting winner:', winnerError);
        // Continue anyway, don't throw
      }

      // Get winner's profile info for notifications
      const { data: winnerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', randomEntry.user_id)
        .single();

      const winnerName = winnerProfile?.full_name || winnerProfile?.email || 'A user';
      const prizeText = giveaway.prize_value ? ` ($${giveaway.prize_value})` : '';

      // === NOTIFICATION 1: Notify the WINNER ===
      const winnerNotificationTitle = '🎉 Congratulations! You Won!';
      const winnerNotificationMessage = `You have been selected as the winner of "${giveaway.title}"${prizeText}. Check your dashboard for more details!`;

      const { error: winnerNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: randomEntry.user_id,
          title: winnerNotificationTitle,
          message: winnerNotificationMessage,
          is_read: false
        });

      if (winnerNotifError) {
        console.error('Error creating winner notification:', winnerNotifError);
      } else {
        console.log(`Notification created for winner ${randomEntry.user_id}`);
      }

      // === NOTIFICATION 2: Notify the COMPANY ===
      if (giveaway.company_id) {
        const companyNotificationTitle = '🏆 Winner Selected for Your Giveaway';
        const companyNotificationMessage = `${winnerName} has been selected as the winner of your giveaway "${giveaway.title}"${prizeText}.`;

        const { error: companyNotifError } = await supabase
          .from('notifications')
          .insert({
            user_id: giveaway.company_id,
            title: companyNotificationTitle,
            message: companyNotificationMessage,
            is_read: false
          });

        if (companyNotifError) {
          console.error('Error creating company notification:', companyNotifError);
        } else {
          console.log(`Notification created for company ${giveaway.company_id}`);
        }
      }

      // === NOTIFICATION 3: Notify all ADMINS ===
      for (const adminId of adminIds) {
        const adminNotificationTitle = '📊 Winner Selected';
        const adminNotificationMessage = `Winner selected for "${giveaway.title}": ${winnerName}${prizeText}.`;

        const { error: adminNotifError } = await supabase
          .from('notifications')
          .insert({
            user_id: adminId,
            title: adminNotificationTitle,
            message: adminNotificationMessage,
            is_read: false
          });

        if (adminNotifError) {
          console.error(`Error creating admin notification for ${adminId}:`, adminNotifError);
        } else {
          console.log(`Notification created for admin ${adminId}`);
        }
      }

      results.push({
        giveaway_id: giveaway.id,
        winner_id: randomEntry.user_id,
        status: 'winner_selected'
      });
    }

    console.log('Winner selection complete. Results:', results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in select-winner function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
