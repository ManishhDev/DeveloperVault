import type { ApiErrorDetail, ErrorCode } from '@devvault/shared';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: ApiErrorDetail[],
  ) {
    super(message);
  }
}

export const notFound = (what = 'Entry') => new HttpError(404, 'NOT_FOUND', `${what} not found`);
