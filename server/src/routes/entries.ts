import { Router } from 'express';
import { entryCreateSchema, entryUpdateSchema, favoriteSchema, listQuerySchema } from '@devvault/shared';
import { parseQuery, validateBody } from '../middleware/validate';
import * as entries from '../services/entries.service';

export const entriesRouter = Router();

entriesRouter.get('/', async (req, res) => {
  res.json(await entries.listEntries(parseQuery(listQuerySchema, req.query)));
});

entriesRouter.get('/:id', async (req, res) => {
  res.json(await entries.getEntry(req.params.id));
});

entriesRouter.post('/', validateBody(entryCreateSchema), async (req, res) => {
  res.status(201).json(await entries.createEntry(req.body));
});

entriesRouter.patch('/:id', validateBody(entryUpdateSchema), async (req, res) => {
  res.json(await entries.updateEntry(String(req.params.id), req.body));
});

entriesRouter.patch('/:id/favorite', validateBody(favoriteSchema), async (req, res) => {
  res.json(await entries.setFavorite(String(req.params.id), req.body.isFavorite));
});

entriesRouter.delete('/:id', async (req, res) => {
  await entries.deleteEntry(req.params.id);
  res.status(204).end();
});
