var _a;
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis;
const db = (_a = globalForPrisma.prisma) != null ? _a : new PrismaClient({
  log: ["query"]
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
export {
  db
};
