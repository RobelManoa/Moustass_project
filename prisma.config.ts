import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    url: process.env.DATABASE_URL || "mysql://user:password@localhost:3306/moustass",
  },

  migrations: {
    path: "prisma/migrations",
  },
});