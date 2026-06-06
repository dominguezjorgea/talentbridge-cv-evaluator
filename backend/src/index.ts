import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import evaluateRouter from './routes/evaluate.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || /^http:\/\/localhost:\d+$/ }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0' });
});

app.use('/api', evaluateRouter);

app.listen(PORT, () => {
  console.log(`[TalentBridge Backend] escuchando en http://localhost:${PORT}`);
});
