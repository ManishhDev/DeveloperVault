import express from 'express';
import cors from 'cors';
import { entriesRouter } from './routes/entries';
import { categoriesRouter } from './routes/categories';
import { statsRouter, tagsRouter } from './routes/tags';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  const origins = process.env.CLIENT_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins?.length) app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/entries', entriesRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/tags', tagsRouter);
  app.use('/api/stats', statsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
