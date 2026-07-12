import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { ForbiddenError } from "../shared/errors/app-error";

export const authorize = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError("Access denied. User authentication context is missing.");
    }

    // ADMIN role automatically bypasses granular check
    const isCcAdmin = req.user.role.toUpperCase() === "ADMIN";
    const hasPermission = req.user.permissions.includes(requiredPermission);

    if (isCcAdmin || hasPermission) {
      return next();
    }

    throw new ForbiddenError(`Access denied. Insufficient permissions. Required: ${requiredPermission}`);
  };
};
