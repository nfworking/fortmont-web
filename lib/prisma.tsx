import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: "172.20.0.15",
  user: "admin",
  password: "StrongPassword",
  database: "fortmontapi",
  allowPublicKeyRetrieval: true,
});

export const prisma = new PrismaClient({ adapter });