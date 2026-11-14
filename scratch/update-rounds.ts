import { prisma } from "../src/lib/prisma";

async function updateRounds() {
  await prisma.admissionRound.updateMany({
    where: { roundType: "QUOTA" },
    data: { name: "รอบโควตาพิเศษ" },
  });
  await prisma.admissionRound.updateMany({
    where: { roundType: "REGULAR" },
    data: { name: "รอบปกติ" },
  });
  console.log("✓ Updated admission round names in DB (stripped parentheses)");
  await prisma.$disconnect();
}

updateRounds();
