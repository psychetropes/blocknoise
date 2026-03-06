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
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(data ?? []);
  } catch (err) {
    console.error('leaderboard error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'failed to fetch leaderboard',
    });
  }
});

export { router as leaderboardRouter };
