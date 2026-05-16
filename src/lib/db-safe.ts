import type { PoolConnection } from "mariadb";
import pool from "@/src/lib/db";
import { logAppError } from "@/src/lib/logger";
import { isTransientDbError, withRetry } from "@/src/lib/retry";

type QueryParams = Array<string | number | boolean | null | Date>;

type SafeQueryOptions = {
  label?: string;
  retries?: number;
};

export async function withDbConnection<T>(callback: (conn: PoolConnection) => Promise<T>, options: SafeQueryOptions = {}) {
  return withRetry(
    async () => {
      const conn = await pool.getConnection();

      try {
        return await callback(conn);
      } catch (error) {
        await logAppError(options.label || "db.connection.operation", error);
        throw error;
      } finally {
        conn.release();
      }
    },
    {
      retries: options.retries ?? 2,
      shouldRetry: isTransientDbError,
      onRetry: (error, attempt) => logAppError(options.label || "db.connection.retry", error, { attempt }),
    }
  );
}

export async function safeQuery<T>(sql: string, params: QueryParams = [], options: SafeQueryOptions = {}) {
  return withDbConnection<T>((conn) => conn.query<T>(sql, params), options);
}

export async function withDbTransaction<T>(callback: (conn: PoolConnection) => Promise<T>, options: SafeQueryOptions = {}) {
  return withRetry(
    async () => {
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();
        const result = await callback(conn);
        await conn.commit();
        return result;
      } catch (error) {
        try {
          await conn.rollback();
        } catch (rollbackError) {
          await logAppError(`${options.label || "db.transaction"}.rollback`, rollbackError);
        }

        await logAppError(options.label || "db.transaction", error);
        throw error;
      } finally {
        conn.release();
      }
    },
    {
      retries: options.retries ?? 2,
      shouldRetry: isTransientDbError,
      onRetry: (error, attempt) => logAppError(options.label || "db.transaction.retry", error, { attempt }),
    }
  );
}
