import express from "express";

import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  sendBookingNotification,
} from "../controllers/bookingController";

import { protect } from "../middleware/authMiddleware";

const router = express.Router();
router.post(
  "/",
  protect as express.RequestHandler,
  createBooking as express.RequestHandler,
);
router.get(
  "/my-bookings",
  protect as express.RequestHandler,
  getMyBookings as express.RequestHandler,
);
router.get(
  "/:id",
  protect as express.RequestHandler,
  getBookingById as express.RequestHandler,
);
router.put(
  "/:id/cancel",
  protect as express.RequestHandler,
  cancelBooking as express.RequestHandler,
);
router.post(
  "/:id/notify",
  protect as express.RequestHandler,
  sendBookingNotification as express.RequestHandler,
);
export default router;
