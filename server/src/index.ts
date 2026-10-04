import { createApp } from './app';
import { prisma } from './lib/prisma';

const port = Number(process.env.PORT ?? 4000);

const server = createApp().listen(port, () => {
  console.log(`DevVault API listening on http://localhost:${port}`);
});

const shutdown = () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
