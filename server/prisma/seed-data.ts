import type { EntryCreateInput, Language } from '@devvault/shared';

export const CATEGORIES = [
  { name: 'Programming', slug: 'programming', icon: '💻' },
  { name: 'Linux', slug: 'linux', icon: '🐧' },
  { name: 'Networking', slug: 'networking', icon: '🌐' },
  { name: 'Database', slug: 'database', icon: '🗄️' },
  { name: 'Git', slug: 'git', icon: '🔧' },
  { name: 'React', slug: 'react', icon: '⚛️' },
  { name: 'Node.js', slug: 'nodejs', icon: '🟢' },
  { name: 'Docker', slug: 'docker', icon: '🐳' },
  { name: 'DSA', slug: 'dsa', icon: '🧠' },
  { name: 'AI/LLM', slug: 'ai-llm', icon: '🤖' },
  { name: 'Debugging', slug: 'debugging', icon: '🐛' },
  { name: 'Resources', slug: 'resources', icon: '📚' },
] as const;

type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export type SampleEntry = Omit<EntryCreateInput, 'categoryId'> & {
  category: CategorySlug;
  language: Language;
};

export const SAMPLE_ENTRIES: SampleEntry[] = [
  {
    title: 'Recursive grep',
    description: 'Search recursively inside files, with line numbers, skipping node_modules.',
    content: 'grep -Rn --exclude-dir=node_modules "pattern" .',
    language: 'bash',
    category: 'linux',
    tags: ['search', 'files'],
    sourceUrl: 'https://man7.org/linux/man-pages/man1/grep.1.html',
    isFavorite: true,
  },
  {
    title: 'Find which process is using a port',
    description: 'Useful when "address already in use" shows up.',
    content: '# Linux / macOS\nlsof -i :3000\n\n# kill it\nkill -9 $(lsof -t -i :3000)',
    language: 'bash',
    category: 'networking',
    tags: ['ports', 'process'],
  },
  {
    title: 'Free a port on Windows',
    description: 'PowerShell equivalent of lsof + kill.',
    content:
      'Get-NetTCPConnection -LocalPort 3000 |\n  Select-Object -ExpandProperty OwningProcess -Unique |\n  ForEach-Object { Stop-Process -Id $_ -Force }',
    language: 'powershell',
    category: 'networking',
    tags: ['ports', 'process', 'windows'],
  },
  {
    title: 'Undo the last commit but keep the changes',
    description: 'Moves HEAD back one commit; your edits stay staged.',
    content: 'git reset --soft HEAD~1',
    language: 'bash',
    category: 'git',
    tags: ['undo', 'commit'],
    isFavorite: true,
  },
  {
    title: 'Interactive rebase the last N commits',
    description: 'Squash, reword or drop commits before opening a PR.',
    content:
      'git rebase -i HEAD~3\n\n# then in the editor:\n# pick  -> keep\n# squash -> merge into previous\n# reword -> change message',
    language: 'bash',
    category: 'git',
    tags: ['rebase', 'history'],
    sourceUrl: 'https://git-scm.com/docs/git-rebase',
  },
  {
    title: 'Recover a deleted branch',
    description: 'The reflog remembers every commit HEAD has pointed to.',
    content: 'git reflog\n# find the sha of the branch tip, then:\ngit switch -c recovered-branch <sha>',
    language: 'bash',
    category: 'git',
    tags: ['undo', 'reflog'],
  },
  {
    title: 'Debounce hook',
    description: 'Delay a fast-changing value (like a search box) until the user stops typing.',
    content: `import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}`,
    language: 'typescript',
    category: 'react',
    tags: ['hooks', 'performance'],
    isFavorite: true,
  },
  {
    title: 'Fix: "Each child in a list should have a unique key"',
    description: 'Use a stable id from your data, never the array index for lists that reorder.',
    content: `{todos.map((todo) => (
  <TodoItem key={todo.id} todo={todo} />
))}`,
    language: 'tsx',
    category: 'react',
    tags: ['warnings', 'lists'],
  },
  {
    title: 'Graceful shutdown for an HTTP server',
    description: 'Stop accepting connections, finish in-flight requests, then close the DB.',
    content: `const server = app.listen(port);

process.on('SIGTERM', () => {
  server.close(async () => {
    await db.disconnect();
    process.exit(0);
  });
});`,
    language: 'javascript',
    category: 'nodejs',
    tags: ['express', 'production'],
  },
  {
    title: 'Read a .env file without dotenv',
    description: 'Node 20.12+ ships this built in.',
    content: 'node --env-file=.env server.js\n\n# or from code:\nprocess.loadEnvFile();',
    language: 'bash',
    category: 'nodejs',
    tags: ['env', 'config'],
    sourceUrl: 'https://nodejs.org/api/cli.html#--env-fileconfig',
  },
  {
    title: 'Remove everything Docker is not using',
    description: 'Stopped containers, dangling images, unused networks and build cache.',
    content: 'docker system df        # see what takes space\ndocker system prune -a --volumes',
    language: 'bash',
    category: 'docker',
    tags: ['cleanup', 'disk-space'],
  },
  {
    title: 'Postgres: find slow queries',
    description: 'Requires the pg_stat_statements extension.',
    content: `SELECT query,
       calls,
       round(mean_exec_time::numeric, 2) AS avg_ms
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;`,
    language: 'sql',
    category: 'database',
    tags: ['postgres', 'performance'],
  },
  {
    title: 'Binary search template',
    description: 'First index where predicate(i) is true. Avoids off-by-one bugs.',
    content: `def first_true(lo: int, hi: int, pred) -> int:
    while lo < hi:
        mid = (lo + hi) // 2
        if pred(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    language: 'python',
    category: 'dsa',
    tags: ['binary-search', 'template'],
  },
  {
    title: 'Call the Claude API with curl',
    description: 'Smallest possible Messages API request.',
    content: `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-sonnet-5-5",
    "max_tokens": 512,
    "messages": [{ "role": "user", "content": "Explain git rebase in one paragraph" }]
  }'`,
    language: 'bash',
    category: 'ai-llm',
    tags: ['api', 'curl'],
    sourceUrl: 'https://docs.anthropic.com/en/api/messages',
  },
  {
    title: 'Node: inspect a running process',
    description: 'Attach Chrome DevTools to a Node app to set breakpoints and profile.',
    content: 'node --inspect src/index.js\n# then open chrome://inspect and click "inspect"',
    language: 'bash',
    category: 'debugging',
    tags: ['devtools', 'breakpoints'],
  },
  {
    title: 'The Missing Semester of Your CS Education',
    description: 'MIT course on the shell, editors, git, debugging and more.',
    content: 'https://missing.csail.mit.edu/',
    language: 'text',
    category: 'resources',
    tags: ['course', 'shell'],
    sourceUrl: 'https://missing.csail.mit.edu/',
  },
];
