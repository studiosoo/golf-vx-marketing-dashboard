import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// DEV BYPASS — remove before deploy
const DEV_USER: User = {
  id: 1,
  openId: "dev-local",
  name: "Dev Preview",
  email: "dev@local",
  loginMethod: "dev",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // DEV BYPASS — remove before deploy
  if (process.env.NODE_ENV === "development") {
    return { req: opts.req, res: opts.res, user: DEV_USER };
  }

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
