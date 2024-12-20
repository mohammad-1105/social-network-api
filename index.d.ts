// index.d.ts

import { IUser } from "@/models/auth/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
