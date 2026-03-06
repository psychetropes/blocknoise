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
import { rateLimiter } from './middleware/rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());
app.use(rateLimiter);

app.use('/generate', generateRouter);
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
