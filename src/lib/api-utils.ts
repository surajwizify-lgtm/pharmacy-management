import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Role } from '@prisma/client';
import { ZodError } from 'zod';
import { authOptions } from './auth';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const notFound = (msg: string) => new ApiError(404, msg);
export const badRequest = (msg: string) => new ApiError(400, msg);
export const conflict = (msg: string) => new ApiError(409, msg);
export const unauthorized = (msg = 'Invalid credentials') => new ApiError(401, msg);
export const forbidden = (msg = 'Insufficient role for this action') => new ApiError(403, msg);

export async function requireSession(allowedRoles?: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw unauthorized('Not authenticated');
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    throw forbidden();
  }
  return session;
}

export function withErrorHandling<T>(handler: () => Promise<T>) {
  return handler().then(
    (data) => NextResponse.json(data),
    (err) => {
      if (err instanceof ApiError) {
        return NextResponse.json({ statusCode: err.status, message: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { statusCode: 400, message: 'Validation failed', errors: err.flatten() },
          { status: 400 },
        );
      }
      console.error(err);
      return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
    },
  );
}
