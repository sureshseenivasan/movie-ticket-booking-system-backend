import { Router, Request, Response } from "express";
import {
  registerUser,
  loginUser,
  getProfile,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = Router();


// BROWSER TEST ROUTES (GET)


// Directly test /api/auth in browser
router.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Auth API endpoint is active.",
    availableEndpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/profile (Protected)",
    ],
  });
});

// Browser GET hints for /register and /login
router.get("/register", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Register endpoint requires a POST request with name, email, password, and phone in JSON body.",
  });
});

router.get("/login", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Login endpoint requires a POST request with email and password in JSON body.",
  });
});


// AUTHENTICATION API ROUTES (POST / GET)


// Register User (Public)
router.post("/register", registerUser);

// Login User (Public)
router.post("/login", loginUser);

// Get User Profile (Protected - Requires Bearer Token)
router.get("/profile", protect, getProfile);

export default router;
