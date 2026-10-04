import { Router } from 'express';
import type { Stats, TagWithCount } from '@devvault/shared';
import { prisma } from '../lib/prisma';

export const tagsRouter = Router();

tagsRouter.get('/', async (_req, res) => {
  const rows = await prisma.tag.findMany({
    orderBy: [{ entries: { _count: 'desc' } }, { name: 'asc' }],
    select: { name: true, _count: { select: { entries: true } } },
  });
  const tags: TagWithCount[] = rows.map((t) => ({ name: t.name, count: t._count.entries }));
  res.json(tags);
});

export const statsRouter = Router();

statsRouter.get('/', async (_req, res) => {
  const [total, favorites] = await prisma.$transaction([
    prisma.entry.count(),
    prisma.entry.count({ where: { isFavorite: true } }),
  ]);
  const stats: Stats = { total, favorites };
  res.json(stats);
});
