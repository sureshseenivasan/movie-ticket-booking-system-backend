import jwt from "jsonwebtoken";

export const generateToken = (userId: string, role: string) => {
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    throw new Error("JWT_SECRET is not defined in .env");
  }

  return jwt.sign(
    {
      id: userId,
      role,
    },
    secretKey,
    {
      expiresIn: "7d",
    }
  );
};

export const verifyToken = (token: string) => {
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    throw new Error("JWT_SECRET is not defined in .env");
  }

  return jwt.verify(token, secretKey);
};

export default generateToken;
