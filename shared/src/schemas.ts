import { z } from 'zod';
import { LANGUAGES, LIMITS, SORTS, normalizeTag } from './constants';

const uniq = <T>(items: T[]) => [...new Set(items)];

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Optional text: '' and null become null, a missing key stays undefined (so PATCH leaves it alone). */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null));

const tagSchema = z
  .string()
  .transform(normalizeTag)
  .pipe(
    z
      .string()
      .min(1, 'Tags cannot be empty')
      .max(LIMITS.tag, `Tags must be at most ${LIMITS.tag} characters`),
  );

const entryFields = {
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(LIMITS.title, `Title must be at most ${LIMITS.title} characters`),
  description: optionalText(LIMITS.description, 'Description'),
  content: z
    .string()
    .max(LIMITS.content, `Content must be at most ${LIMITS.content.toLocaleString('en-US')} characters`)
    .refine((v) => v.trim().length > 0, 'Content is required'),
  language: z.enum(LANGUAGES, { error: 'Unknown language' }),
  categoryId: z.string().min(1, 'Pick a category'),
  tags: z
    .array(tagSchema)
    .max(LIMITS.tags, `At most ${LIMITS.tags} tags`)
    .transform((tags) => uniq(tags)),
  sourceUrl: z
    .string()
    .trim()
    .max(LIMITS.url)
    .refine((v) => v === '' || isHttpUrl(v), 'Must be a valid http(s) URL')
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)),
  isFavorite: z.boolean(),
};

export const entryCreateSchema = z.object({
  ...entryFields,
  language: entryFields.language.default('text'),
  tags: entryFields.tags.default([]),
  isFavorite: entryFields.isFavorite.default(false),
});

export const entryUpdateSchema = z
  .object(entryFields)
  .partial()
  .refine((body) => Object.values(body).some((v) => v !== undefined), 'Nothing to update');

export const favoriteSchema = z.object({ isFavorite: z.boolean() });

export const listQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || undefined),
  category: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined),
  tags: z
    .string()
    .optional()
    .transform((v) => uniq((v ?? '').split(',').map(normalizeTag).filter(Boolean))),
  favorite: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  sort: z.enum(SORTS).default('updated'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(LIMITS.maxPageSize).default(LIMITS.pageSize),
});

export type EntryCreateInput = z.input<typeof entryCreateSchema>;
export type EntryCreate = z.output<typeof entryCreateSchema>;
export type EntryUpdate = z.output<typeof entryUpdateSchema>;
export type ListQuery = z.output<typeof listQuerySchema>;
