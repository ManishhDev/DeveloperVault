import type { RequestHandler } from 'express';
import type { z } from 'zod';

/** Parses req.body with a Zod schema; failures reach the error handler as a ZodError (-> 400). */
export const validateBody =
  (schema: z.ZodType): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };

/** Express 5 makes req.query read-only, so the parsed query is returned instead. */
export const parseQuery = <S extends z.ZodType>(schema: S, query: unknown): z.output<S> =>
  schema.parse(query);
