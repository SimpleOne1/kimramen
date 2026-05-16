import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { fail } from "@/src/lib/server/api-response";
import { logError, logRequest } from "@/src/lib/server/logger";

type HandlerContext<TBody = unknown> = {
  request: NextRequest;
  body: TBody;
};

type Handler<TBody = unknown> = (ctx: HandlerContext<TBody>) => Promise<NextResponse>;

type ApiHandlerOptions<TBody> = {
  name: string;
  bodySchema?: ZodSchema<TBody>;
  logRequests?: boolean;
};

function getIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function validationError(error: ZodError) {
  return fail("Некорректные данные запроса", 422, error.flatten());
}

export function apiHandler<TBody = unknown>(options: ApiHandlerOptions<TBody>, handler: Handler<TBody>) {
  return async (request: NextRequest) => {
    const startedAt = Date.now();

    try {
      let rawBody: unknown = undefined;
      let body = undefined as TBody;

      if (options.bodySchema) {
        rawBody = await request.json().catch(() => ({}));
        const parsed = options.bodySchema.safeParse(rawBody);
        if (!parsed.success) return validationError(parsed.error);
        body = parsed.data;
      }

      const response = await handler({ request, body });

      if (options.logRequests) {
        logRequest({
          name: options.name,
          method: request.method,
          path: request.nextUrl.pathname,
          status: response.status,
          ms: Date.now() - startedAt,
          ip: getIp(request),
        });
      }

      return response;
    } catch (error) {
      logError(options.name, error, {
        method: request.method,
        path: request.nextUrl.pathname,
        ms: Date.now() - startedAt,
        ip: getIp(request),
      });

      return fail("Внутренняя ошибка сервера", 500);
    }
  };
}
