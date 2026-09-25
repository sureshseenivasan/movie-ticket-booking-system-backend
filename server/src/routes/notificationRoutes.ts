import express from "express";

import {
  sendBookingConfirmation,
} from "../controllers/notificationController";
import {
  getMyNotifications,
  markNotificationRead
} from "../controllers/notificationController";

import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get(
  "/",
  protect,
  getMyNotifications
);

router.put(
  "/:id/read",
  protect,
  markNotificationRead
);


// SEND BOOKING CONFIRMATION

router.post(
  "/booking/:bookingId",
  protect,
  sendBookingConfirmation
);


export default router;
