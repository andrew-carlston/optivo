import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Main branch connection (company routing, super users, auth tables)
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

/**
 * Create a Drizzle instance for a company's Neon branch.
 * Swaps the endpoint hostname in DATABASE_URL with the branch host.
 */
export function createBranchDb(branchHost: string) {
  const branchUrl = process.env.DATABASE_URL!.replace(/@[^/]+/, `@${branchHost}`);
  const branchSql = neon(branchUrl);
  return drizzle(branchSql, { schema });
}
