import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { CategoryWithCount, Entry, Paginated, TagWithCount } from '@devvault/shared';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { CATEGORIES } from '../prisma/seed-data';

const api = request(createApp());
let linuxId: string;
let gitId: string;

async function create(body: Record<string, unknown>) {
  const res = await api.post('/api/entries').send({ categoryId: linuxId, content: 'x', ...body });
  expect(res.status).toBe(201);
  return res.body as Entry;
}

async function list(query: Record<string, string> = {}) {
  const res = await api.get('/api/entries').query(query);
  expect(res.status).toBe(200);
  return res.body as Paginated<Entry>;
}

beforeAll(async () => {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({ where: { slug: category.slug }, update: {}, create: category });
  }
  const categories = await prisma.category.findMany();
  linuxId = categories.find((c) => c.slug === 'linux')!.id;
  gitId = categories.find((c) => c.slug === 'git')!.id;
});

beforeEach(async () => {
  await prisma.entry.deleteMany();
  await prisma.tag.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('entries CRUD', () => {
  it('create → get → update → delete', async () => {
    const created = await create({
      title: '  Recursive grep ',
      description: 'Search recursively',
      content: 'grep -R "pattern" .',
      language: 'bash',
      tags: ['Search', '#files', 'search'],
      sourceUrl: 'https://man7.org/linux/man-pages/man1/grep.1.html',
    });
    expect(created).toMatchObject({
      title: 'Recursive grep',
      language: 'bash',
      isFavorite: false,
      tags: ['files', 'search'],
      category: { slug: 'linux', name: 'Linux', icon: '🐧' },
    });

    const fetched = await api.get(`/api/entries/${created.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(created.id);

    const updated = await api
      .patch(`/api/entries/${created.id}`)
      .send({ title: 'grep -R', categoryId: gitId, tags: ['files', 'unix'], sourceUrl: '' });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      title: 'grep -R',
      description: 'Search recursively', // untouched by a partial update
      category: { slug: 'git' },
      tags: ['files', 'unix'],
      sourceUrl: null,
    });

    // "search" is no longer used by any entry, so it is gone
    const tags = (await api.get('/api/tags')).body as TagWithCount[];
    expect(tags.map((t) => t.name).sort()).toEqual(['files', 'unix']);

    const deleted = await api.delete(`/api/entries/${created.id}`);
    expect(deleted.status).toBe(204);
    expect((await api.get(`/api/entries/${created.id}`)).status).toBe(404);
    expect((await api.get('/api/tags')).body).toEqual([]);
  });

  it('toggles favorite and reflects it in stats', async () => {
    const entry = await create({ title: 'a' });
    const res = await api.patch(`/api/entries/${entry.id}/favorite`).send({ isFavorite: true });
    expect(res.status).toBe(200);
    expect(res.body.isFavorite).toBe(true);
    expect((await api.get('/api/stats')).body).toEqual({ total: 1, favorites: 1 });
  });

  it('returns 404 for unknown ids on every verb', async () => {
    expect((await api.get('/api/entries/nope')).status).toBe(404);
    expect((await api.patch('/api/entries/nope').send({ title: 'x' })).status).toBe(404);
    expect((await api.patch('/api/entries/nope/favorite').send({ isFavorite: true })).status).toBe(404);
    const del = await api.delete('/api/entries/nope');
    expect(del.status).toBe(404);
    expect(del.body.error.code).toBe('NOT_FOUND');
  });
});

describe('validation', () => {
  it('rejects a bad create body with field details', async () => {
    const res = await api.post('/api/entries').send({
      title: '',
      content: '   ',
      categoryId: linuxId,
      sourceUrl: 'ftp://example.com',
      tags: Array.from({ length: 11 }, (_, i) => `t${i}`),
      language: 'klingon',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d: { path: string }) => d.path).sort();
    expect(paths).toEqual(['content', 'language', 'sourceUrl', 'tags', 'title']);
  });

  it('rejects titles over 120 chars and unknown categories', async () => {
    const long = await api
      .post('/api/entries')
      .send({ title: 'x'.repeat(121), content: 'x', categoryId: linuxId });
    expect(long.status).toBe(400);
    const badCategory = await api
      .post('/api/entries')
      .send({ title: 'x', content: 'x', categoryId: 'missing' });
    expect(badCategory.status).toBe(400);
    expect(badCategory.body.error.details[0].path).toBe('categoryId');
  });

  it('rejects an empty PATCH, a bad favorite body and malformed JSON', async () => {
    const entry = await create({ title: 'a' });
    expect((await api.patch(`/api/entries/${entry.id}`).send({})).status).toBe(400);
    expect((await api.patch(`/api/entries/${entry.id}/favorite`).send({ isFavorite: 'yes' })).status).toBe(
      400,
    );
    const bad = await api.post('/api/entries').set('content-type', 'application/json').send('{"title":');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('INVALID_JSON');
  });

  it('rejects bad list params', async () => {
    expect((await api.get('/api/entries?limit=51')).status).toBe(400);
    expect((await api.get('/api/entries?sort=random')).status).toBe(400);
    expect((await api.get('/api/entries?page=0')).status).toBe(400);
  });
});

describe('list, search and filters', () => {
  beforeEach(async () => {
    await create({
      title: 'Recursive grep',
      content: 'grep -R "x" .',
      tags: ['search', 'files'],
      isFavorite: true,
    });
    await create({
      title: 'Find big files',
      description: 'uses du',
      content: 'du -sh * | sort -h',
      tags: ['files'],
    });
    await create({
      title: 'Undo commit',
      content: 'git reset --soft HEAD~1',
      categoryId: gitId,
      tags: ['undo'],
    });
    await create({
      title: 'SSH tunnel',
      content: 'ssh -L 8080:localhost:80 host',
      tags: ['ssh', 'networking'],
    });
  });

  it('searches title, description, content and tags case-insensitively', async () => {
    expect((await list({ q: 'GREP' })).data.map((e) => e.title)).toEqual(['Recursive grep']);
    expect((await list({ q: 'uses DU' })).data.map((e) => e.title)).toEqual(['Find big files']);
    expect((await list({ q: 'HEAD~1' })).data.map((e) => e.title)).toEqual(['Undo commit']);
    expect((await list({ q: 'network' })).data.map((e) => e.title)).toEqual(['SSH tunnel']);
  });

  it('filters by category, all tags and favorite, and combines them', async () => {
    expect((await list({ category: 'git' })).meta.total).toBe(1);
    expect((await list({ tags: 'files' })).meta.total).toBe(2);
    expect((await list({ tags: 'files,search' })).data.map((e) => e.title)).toEqual(['Recursive grep']);
    expect((await list({ favorite: 'true' })).meta.total).toBe(1);
    expect((await list({ category: 'linux', tags: 'files', q: 'du', favorite: 'false' })).meta.total).toBe(1);
    expect((await list({ category: 'git', tags: 'files' })).meta.total).toBe(0);
  });

  it('sorts and paginates', async () => {
    const byTitle = await list({ sort: 'title' });
    expect(byTitle.data.map((e) => e.title)).toEqual([
      'Find big files',
      'Recursive grep',
      'SSH tunnel',
      'Undo commit',
    ]);

    const byUpdated = await list();
    expect(byUpdated.data[0]!.title).toBe('SSH tunnel'); // most recently created/updated first

    const page2 = await list({ sort: 'title', limit: '3', page: '2' });
    expect(page2.meta).toEqual({ page: 2, limit: 3, total: 4, totalPages: 2 });
    expect(page2.data.map((e) => e.title)).toEqual(['Undo commit']);
  });

  it('returns categories and tags with counts', async () => {
    const categories = (await api.get('/api/categories')).body as CategoryWithCount[];
    expect(categories).toHaveLength(CATEGORIES.length);
    expect(categories.find((c) => c.slug === 'linux')!.count).toBe(3);

    const tags = (await api.get('/api/tags')).body as TagWithCount[];
    expect(tags[0]).toEqual({ name: 'files', count: 2 });
  });
});
