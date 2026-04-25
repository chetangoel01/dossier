import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { buildSampleDossier } from "../src/server/lib/sample-dossier";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding demo data...");

  // Clear existing demo user (cascades to all related data)
  await prisma.user.deleteMany({ where: { email: "demo@dossier.local" } });

  const passwordHash = await bcrypt.hash("password", 10);

  const user = await prisma.user.create({
    data: {
      email: "demo@dossier.local",
      name: "Alex Mercer",
      password_hash: passwordHash,
    },
  });

  const { dossierId } = await buildSampleDossier(prisma, user.id);

  console.log(`Seed complete.`);
  console.log(`  User:      ${user.email}`);
  console.log(`  Dossier:   ${dossierId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
