import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User";
import generateToken from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";


// REGISTER USER


export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });

      return;
    }

    // Check existing user
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists",
      });

      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    // Generate token
    const token = generateToken(
      user._id.toString(),
      user.role
    );

    res.status(201).json({
      message: "User registered successfully",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Register Error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};



// LOGIN USER


export const loginUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Login request body:", req.body);
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });

      return;
    }

    // Find user
    const user = await User.findOne({
      email,
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

      return;
    }

    // Compare password
    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

      return;
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET || "",
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error: any) {
    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// GET USER PROFILE

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {

  try {

    if (!req.user) {

      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });

      return;
    }

    const user = await User.findById(
      req.user.id
    ).select("-password");

    if (!user) {

      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    console.error(
      "Profile Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};
