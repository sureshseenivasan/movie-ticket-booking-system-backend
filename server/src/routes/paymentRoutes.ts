import express from "express";

import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  createPaymentOrder,
  verifyPayment,
} from "../controllers/paymentController";

import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// Razorpay order creation and payment verification
router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPayment);

// Generic payment record CRUD (kept as-is from the existing project)
router.post("/", createPayment);
router.get("/", getPayments);
router.get("/:id", getPaymentById);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;
