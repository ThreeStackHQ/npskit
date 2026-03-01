import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";
export { eq, and, or, gt, lt, gte, lte, desc, asc, count, sql, isNull, isNotNull, inArray, between } from "drizzle-orm";

// Lazy DB singleton — never throws at module load time
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createDb(): ReturnType<typeof drizzle<typeof schema>> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const client = postgres(url, { max: 10 });
  return drizzle(client, { schema });
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    if (!_db) {
      _db = createDb();
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
