import "dotenv/config";
import { PrismaClient, } from "@prisma/client";

import { Pool } from "pg";
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
