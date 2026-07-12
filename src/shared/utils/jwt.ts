import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "transitops-super-secret-access-token-key-2026";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "transitops-super-secret-refresh-token-key-2026";
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

export interface UserTokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export const generateAccessToken = (payload: UserTokenPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRY as any });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY as any });
};

export const verifyAccessToken = (token: string): UserTokenPayload => {
  return jwt.verify(token, JWT_ACCESS_SECRET) as UserTokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
};
