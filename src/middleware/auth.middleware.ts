import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, UserTokenPayload } from "../shared/utils/jwt";
import { UnauthorizedError } from "../shared/errors/app-error";
import { redis } from "../config/redis";

export interface AuthenticatedRequest extends Request {
  user?: UserTokenPayload;
  token?: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing.");
    }

    const token = authHeader.split(" ")[1];

    // Check Redis token blacklist
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError("Token has been invalidated. Please login again.");
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    req.token = token;
    next();
  } catch (error: any) {
    next(new UnauthorizedError(error.message || "Invalid or expired access token."));
  }
};
