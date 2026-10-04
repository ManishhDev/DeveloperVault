import type { Language } from './constants';

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface CategoryWithCount extends CategoryRef {
  count: number;
}

export interface TagWithCount {
  name: string;
  count: number;
}

export interface Entry {
  id: string;
  title: string;
  description: string | null;
  content: string;
  language: Language;
  sourceUrl: string | null;
  isFavorite: boolean;
  category: CategoryRef;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface Stats {
  total: number;
  favorites: number;
}

export type ErrorCode = 'VALIDATION_ERROR' | 'INVALID_JSON' | 'NOT_FOUND' | 'INTERNAL_ERROR';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: ApiErrorDetail[];
  };
}
