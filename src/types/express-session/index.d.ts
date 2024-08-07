import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    isLoggedIn: boolean;
    roles: number[];
    services: number[];
  }
}
