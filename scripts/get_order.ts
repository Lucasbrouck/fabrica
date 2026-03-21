import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function get() {
  const o = await prisma.order.findFirst();
  console.log("UUID:", o?.id);
  await prisma.$disconnect();
}

get();
