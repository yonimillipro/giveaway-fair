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
      .select('id, title')
      .eq('winner_selected', false)
      .lt('end_date', new Date().toISOString());

    if (giveawayError) {
      console.error('Error fetching ended giveaways:', giveawayError);
      throw giveawayError;
    }

    console.log(`Found ${endedGiveaways?.length || 0} giveaways needing winner selection`);

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
        
        // Mark as winner_selected even if no entries (to prevent re-processing)
        await supabase
          .from('giveaways')
          .update({ winner_selected: true })
          .eq('id', giveaway.id);

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

      // Create in-app notification for the winner
      const notificationTitle = '🎉 You Won!';
      const notificationMessage = `You have been selected as the winner of "${giveaway.title}"`;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: randomEntry.user_id,
          title: notificationTitle,
          message: notificationMessage,
          is_read: false
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Continue anyway, don't throw - winner was still selected
      } else {
        console.log(`Notification created for winner ${randomEntry.user_id}`);
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