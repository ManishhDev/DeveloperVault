/** Plain values with no runtime dependencies, safe to import anywhere. */
export const LANGUAGES = [
  'text',
  'bash',
  'powershell',
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'json',
  'python',
  'sql',
  'go',
  'rust',
  'java',
  'c',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'html',
  'css',
  'yaml',
  'toml',
  'ini',
  'dockerfile',
  'nginx',
  'graphql',
  'markdown',
  'diff',
] as const;
export type Language = (typeof LANGUAGES)[number];

export const SORTS = ['updated', 'created', 'title'] as const;
export type Sort = (typeof SORTS)[number];

export const LIMITS = {
  title: 120,
  description: 500,
  content: 20_000,
  tags: 10,
  tag: 30,
  url: 2048,
  pageSize: 20,
  maxPageSize: 50,
} as const;

export function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-');
}
