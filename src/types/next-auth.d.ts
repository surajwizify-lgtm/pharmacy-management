import { Role } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

// Extends NextAuth's built-in types with the fields our app actually
// needs on the session/token: numeric user id + pharmacy Role enum.
// Mirrors the JwtPayload shape from the old NestJS JwtStrategy.
declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    fullName: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      fullName: string;
      role: Role;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    fullName: string;
    role: Role;
  }
}
