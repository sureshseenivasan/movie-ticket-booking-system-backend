import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

interface JwtPayload {
  id: string;
  role: string;
}



// PROTECT ROUTES


export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  try {

    const authorization =
      req.headers.authorization;

    if (!authorization) {

      res.status(401).json({
        message: "Authorization token missing",
      });

      return;
    }

    if (!authorization.startsWith("Bearer ")) {

      res.status(401).json({
        message: "Invalid authorization format",
      });

      return;
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      res.status(401).json({
        message: "Invalid authorization format",
      });

      return;
    }

    const secretKey = process.env.JWT_SECRET;

    if (!secretKey) {
      throw new Error(
        "JWT_SECRET is not defined"
      );
    }

    const decoded = jwt.verify(
      token,
      secretKey
    ) as unknown as unknown as {
      id: string;
      role: string;
    };

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();

  } catch (error) {

    console.error(
      "Authentication Error:",
      error
    );

    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};



// ADMIN ONLY


export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  if (!req.user) {

    res.status(401).json({
      message: "Unauthorized",
    });

    return;
  }

  if (req.user.role !== "admin") {

    res.status(403).json({
      message:
        "Admin access required",
    });

    return;
  }

  next();
};
