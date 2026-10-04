import { PrismaClient } from '@prisma/client';
import { entryCreateSchema } from '@devvault/shared';
import { CATEGORIES, SAMPLE_ENTRIES } from './seed-data';

const prisma = new PrismaClient();

async function seedCategories() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, icon: category.icon },
      create: category,
    });
  }
}

async function seedEntries() {
  if ((await prisma.entry.count()) > 0) {
    console.log('Entries already exist, skipping sample entries.');
    return;
  }

  const categories = await prisma.category.findMany();
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  // oldest first, so the first sample shows up first under "recently updated"
  for (const [i, sample] of [...SAMPLE_ENTRIES].reverse().entries()) {
    const { category, ...rest } = sample;
    const { tags, ...data } = entryCreateSchema.parse({ ...rest, categoryId: idBySlug.get(category) });
    const timestamp = new Date(Date.now() - (SAMPLE_ENTRIES.length - i) * 7 * 3_600_000);
    await prisma.entry.create({
      data: {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
        tags: { connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })) },
      },
    });
  }
  console.log(`Created ${SAMPLE_ENTRIES.length} sample entries.`);
}

async function main() {
  await seedCategories();
  console.log(`Seeded ${CATEGORIES.length} categories.`);
  await seedEntries();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
