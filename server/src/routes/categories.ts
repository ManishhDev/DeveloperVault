import { Router } from 'express';
import type { CategoryWithCount } from '@devvault/shared';
import { prisma } from '../lib/prisma';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_req, res) => {
  const rows = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { entries: true } } },
  });
  const categories: CategoryWithCount[] = rows.map(({ _count, ...category }) => ({
    ...category,
    count: _count.entries,
  }));
  res.json(categories);
});
