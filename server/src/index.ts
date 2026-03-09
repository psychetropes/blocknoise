import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateRouter } from './routes/generate';
import { uploadRouter } from './routes/upload';
import { leaderboardRouter } from './routes/leaderboard';
import { voteRouter } from './routes/vote';
import { radioRouter } from './routes/radio';
import { priceRouter } from './routes/price';
import { genresRouter } from './routes/genres';
import { rateLimiter, generateLimiter } from './middleware/rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3001;

// restrict CORS to known origins in production
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : undefined; // undefined = allow all (dev mode)
app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: '5mb' }));
app.use(rateLimiter);

app.use('/generate', generateLimiter, generateRouter);
app.use('/upload', uploadRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/vote', voteRouter);
app.use('/radio', radioRouter);
app.use('/price', priceRouter);
app.use('/genres', genresRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'blocknoise-api' });
});

app.listen(port, () => {
  console.log(`blocknoise api running on port ${port}`);
});
