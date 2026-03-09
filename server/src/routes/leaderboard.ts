import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: 'supabase not configured' });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('usis')
      .select('id, wallet_address, display_name, arweave_url, tier, genre, catalog_number, created_at')
      .order('catalog_number', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(
      (data ?? []).map((entry) => ({
        ...entry,
        score: 0,
        vote_count: 0,
      }))
    );
  } catch (err) {
    console.error('leaderboard error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'failed to fetch leaderboard',
    });
  }
});

export { router as leaderboardRouter };
