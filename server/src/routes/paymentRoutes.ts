import express from "express";
import razorpay from "razorpay";


import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
} from "../controllers/paymentController";



import {
  protect,
} from "../middleware/authMiddleware";


const router = express.Router();

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});


// CREATE PAYMENT
router.post("/", createPayment);


// GET ALL PAYMENTS
router.get("/", getPayments);


// GET PAYMENT BY ID
router.get("/:id", getPaymentById);


// UPDATE PAYMENT
router.put("/:id", updatePayment);


// DELETE PAYMENT
router.delete("/:id", deletePayment);


export default router;



