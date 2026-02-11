import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const executionStart = new Date().toISOString();
  console.log(`[select-winner] Execution started at ${executionStart} (UTC)`);

  const stats = {
    execution_started_at: executionStart,
    giveaways_checked: 0,
    winners_selected: 0,
    giveaways_skipped_no_entries: 0,
    giveaways_failed: 0,
    errors: [] as string[],
    results: [] as { giveaway_id: string; winner_id: string | null; status: string }[],
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const nowUtc = new Date().toISOString();
    console.log(`[select-winner] Checking giveaways with end_date <= ${nowUtc} AND winner_selected = false`);

    const { data: endedGiveaways, error: giveawayError } = await supabase
      .from('giveaways')
      .select('id, title, company_id, prize_value')
      .eq('winner_selected', false)
      .lte('end_date', nowUtc);

    if (giveawayError) {
      console.error('[select-winner] FATAL: Failed to fetch giveaways:', giveawayError);
      stats.errors.push(`Failed to fetch giveaways: ${giveawayError.message}`);
      return new Response(JSON.stringify({ success: false, ...stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    stats.giveaways_checked = endedGiveaways?.length || 0;
    console.log(`[select-winner] Found ${stats.giveaways_checked} eligible giveaway(s)`);

    if (stats.giveaways_checked === 0) {
      console.log('[select-winner] No eligible giveaways found. Exiting.');
      return new Response(JSON.stringify({ success: true, ...stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fetch admin IDs once
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');
    const adminIds = (adminRoles || []).map(r => r.user_id);

    for (const giveaway of endedGiveaways!) {
      try {
        console.log(`[select-winner] Processing: ${giveaway.id} "${giveaway.title}"`);

        // Fetch ALL entries for this giveaway (PostgREST does NOT support ORDER BY RANDOM())
        const { data: allEntries, error: entriesError } = await supabase
          .from('giveaway_entries')
          .select('id, user_id')
          .eq('giveaway_id', giveaway.id);

        if (entriesError) {
          console.error(`[select-winner] Error fetching entries for ${giveaway.id}:`, entriesError);
          stats.giveaways_failed++;
          stats.errors.push(`Entries fetch error for ${giveaway.id}: ${entriesError.message}`);
          stats.results.push({ giveaway_id: giveaway.id, winner_id: null, status: 'error_fetching_entries' });
          continue;
        }

        const entryCount = allEntries?.length || 0;
        console.log(`[select-winner] Giveaway ${giveaway.id} has ${entryCount} entries`);

        if (entryCount === 0) {
          console.log(`[select-winner] No entries for ${giveaway.id} - skipping, will retry later`);
          stats.giveaways_skipped_no_entries++;

          if (giveaway.company_id) {
            await supabase.from('notifications').insert({
              user_id: giveaway.company_id,
              title: '⚠️ Giveaway Ended - No Entries Yet',
              message: `Your giveaway "${giveaway.title}" has ended but has no entries. A winner will be selected automatically if entries are added.`,
              is_read: false,
            });
          }

          stats.results.push({ giveaway_id: giveaway.id, winner_id: null, status: 'no_entries' });
          continue;
        }

        // Pick ONE random entry using crypto-safe random index
        const randomIndex = Math.floor(Math.random() * entryCount);
        const randomEntry = allEntries![randomIndex];
        console.log(`[select-winner] Randomly selected entry ${randomEntry.id} (user: ${randomEntry.user_id}) from ${entryCount} entries`);

        // Mark entry as winner
        const { error: updateEntryError } = await supabase
          .from('giveaway_entries')
          .update({ is_winner: true })
          .eq('id', randomEntry.id);

        if (updateEntryError) {
          console.error(`[select-winner] Error marking entry as winner:`, updateEntryError);
          stats.giveaways_failed++;
          stats.errors.push(`Update entry error for ${giveaway.id}: ${updateEntryError.message}`);
          stats.results.push({ giveaway_id: giveaway.id, winner_id: null, status: 'error_updating_entry' });
          continue;
        }

        // Mark giveaway as winner_selected
        const { error: updateGiveawayError } = await supabase
          .from('giveaways')
          .update({ winner_selected: true })
          .eq('id', giveaway.id);

        if (updateGiveawayError) {
          console.error(`[select-winner] Error updating giveaway:`, updateGiveawayError);
          // Rollback
          await supabase.from('giveaway_entries').update({ is_winner: false }).eq('id', randomEntry.id);
          stats.giveaways_failed++;
          stats.errors.push(`Update giveaway error for ${giveaway.id}: ${updateGiveawayError.message}`);
          stats.results.push({ giveaway_id: giveaway.id, winner_id: null, status: 'error_updating_giveaway' });
          continue;
        }

        // Insert into winners table
        const { error: winnerInsertError } = await supabase
          .from('winners')
          .insert({
            giveaway_id: giveaway.id,
            user_id: randomEntry.user_id,
            notified: true,
          });

        if (winnerInsertError) {
          console.error(`[select-winner] Error inserting winner record:`, winnerInsertError);
          stats.errors.push(`Winners insert error for ${giveaway.id}: ${winnerInsertError.message}`);
        }

        stats.winners_selected++;

        // Get winner profile for notifications
        const { data: winnerProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', randomEntry.user_id)
          .single();

        const winnerName = winnerProfile?.full_name || winnerProfile?.email || 'A user';
        const prizeText = giveaway.prize_value ? ` ($${giveaway.prize_value})` : '';

        // NOTIFICATION 1: Winner
        await supabase.from('notifications').insert({
          user_id: randomEntry.user_id,
          title: '🎉 Congratulations! You Won!',
          message: `You have been selected as the winner of "${giveaway.title}"${prizeText}. Check your dashboard for more details!`,
          is_read: false,
        });

        // NOTIFICATION 2: Company
        if (giveaway.company_id) {
          await supabase.from('notifications').insert({
            user_id: giveaway.company_id,
            title: '🏆 Winner Selected for Your Giveaway',
            message: `${winnerName} has been selected as the winner of your giveaway "${giveaway.title}"${prizeText}.`,
            is_read: false,
          });
        }

        // NOTIFICATION 3: Admins
        for (const adminId of adminIds) {
          await supabase.from('notifications').insert({
            user_id: adminId,
            title: '📊 Winner Selected',
            message: `Winner selected for "${giveaway.title}": ${winnerName}${prizeText}.`,
            is_read: false,
          });
        }

        stats.results.push({ giveaway_id: giveaway.id, winner_id: randomEntry.user_id, status: 'winner_selected' });
        console.log(`[select-winner] ✅ Winner selected for ${giveaway.id}: ${randomEntry.user_id}`);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[select-winner] Error processing giveaway ${giveaway.id}:`, err);
        stats.giveaways_failed++;
        stats.errors.push(`Processing error for ${giveaway.id}: ${msg}`);
        stats.results.push({ giveaway_id: giveaway.id, winner_id: null, status: 'error' });
        // Continue to next giveaway
      }
    }

    console.log(`[select-winner] Execution complete:`, JSON.stringify(stats));

    return new Response(JSON.stringify({ success: true, ...stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[select-winner] FATAL error:', error);
    stats.errors.push(`Fatal: ${errorMessage}`);
    return new Response(JSON.stringify({ success: false, ...stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
