import type { Prisma } from '@prisma/client';
import type { Entry, EntryCreate, EntryUpdate, Language, ListQuery, Paginated } from '@devvault/shared';
import { prisma } from '../lib/prisma';
import { HttpError, notFound } from '../lib/errors';

const entryInclude = {
  category: { select: { id: true, name: true, slug: true, icon: true } },
  tags: { select: { name: true }, orderBy: { name: 'asc' } },
} satisfies Prisma.EntryInclude;

type EntryRow = Prisma.EntryGetPayload<{ include: typeof entryInclude }>;

function toDto(row: EntryRow): Entry {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    language: row.language as Language,
    sourceUrl: row.sourceUrl,
    isFavorite: row.isFavorite,
    category: row.category,
    tags: row.tags.map((t) => t.name),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const ORDER_BY: Record<ListQuery['sort'], Prisma.EntryOrderByWithRelationInput[]> = {
  updated: [{ updatedAt: 'desc' }, { id: 'asc' }],
  created: [{ createdAt: 'desc' }, { id: 'asc' }],
  title: [{ title: 'asc' }, { id: 'asc' }],
};

function buildWhere({ q, category, tags, favorite }: ListQuery): Prisma.EntryWhereInput {
  const and: Prisma.EntryWhereInput[] = [];

  if (q) {
    const contains = { contains: q, mode: 'insensitive' } as const;
    and.push({
      OR: [
        { title: contains },
        { description: contains },
        { content: contains },
        { tags: { some: { name: contains } } },
      ],
    });
  }
  if (category) and.push({ category: { slug: category } });
  // the entry must carry every requested tag
  for (const name of tags) and.push({ tags: { some: { name } } });
  if (favorite !== undefined) and.push({ isFavorite: favorite });

  return { AND: and };
}

export async function listEntries(query: ListQuery): Promise<Paginated<Entry>> {
  const where = buildWhere(query);
  const { page, limit } = query;

  const [rows, total] = await prisma.$transaction([
    prisma.entry.findMany({
      where,
      include: entryInclude,
      orderBy: ORDER_BY[query.sort],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.entry.count({ where }),
  ]);

  return {
    data: rows.map(toDto),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getEntry(id: string): Promise<Entry> {
  const row = await prisma.entry.findUnique({ where: { id }, include: entryInclude });
  if (!row) throw notFound();
  return toDto(row);
}

async function assertCategoryExists(categoryId: string) {
  const exists = await prisma.category.count({ where: { id: categoryId } });
  if (!exists) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Category does not exist', [
      { path: 'categoryId', message: 'Category does not exist' },
    ]);
  }
}

const connectTags = (names: string[]) => names.map((name) => ({ where: { name }, create: { name } }));

/** Tags live only as long as some entry uses them. */
const deleteOrphanTags = (tx: Prisma.TransactionClient) =>
  tx.tag.deleteMany({ where: { entries: { none: {} } } });

export async function createEntry(input: EntryCreate): Promise<Entry> {
  await assertCategoryExists(input.categoryId);
  const { tags, ...fields } = input;
  const row = await prisma.entry.create({
    data: { ...fields, tags: { connectOrCreate: connectTags(tags) } },
    include: entryInclude,
  });
  return toDto(row);
}

export async function updateEntry(id: string, input: EntryUpdate): Promise<Entry> {
  if (input.categoryId) await assertCategoryExists(input.categoryId);
  const { tags, ...fields } = input;

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.entry.update({
      where: { id },
      data: {
        ...fields,
        ...(tags && { tags: { set: [], connectOrCreate: connectTags(tags) } }),
      },
      include: entryInclude,
    });
    if (tags) await deleteOrphanTags(tx);
    return updated;
  });
  return toDto(row);
}

export async function setFavorite(id: string, isFavorite: boolean): Promise<Entry> {
  const row = await prisma.entry.update({
    where: { id },
    data: { isFavorite },
    include: entryInclude,
  });
  return toDto(row);
}

export async function deleteEntry(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.entry.delete({ where: { id } });
    await deleteOrphanTags(tx);
  });
}
