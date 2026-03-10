import { Router, Request, Response } from 'express';
import { reverseSnsLookup } from '../sns';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const walletAddress = String(req.query.walletAddress ?? '').trim();

  if (!walletAddress) {
    res.status(400).json({ error: 'walletAddress is required' });
    return;
  }

  const domain = await reverseSnsLookup(walletAddress);
  const skrDiscountEligible = !!domain && (domain.endsWith('.skr') || domain.endsWith('.sol'));

  res.json({
    walletAddress,
    domain,
    skrDiscountEligible,
  });
});

export { router as eligibilityRouter };
