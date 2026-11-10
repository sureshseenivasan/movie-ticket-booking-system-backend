// Save as server/routes/seatLockRoutes.ts
//
// Then in server.ts, next to your other app.use(...) lines, add:
//
//   import seatLockRoutes from "./routes/seatLockRoutes";
//   app.use("/api/seat-locks", seatLockRoutes);
//
// This file is self-contained: it holds the handler and the route together.
// It also creates any seat records that don't exist yet, so locking works
// for every showtime, however the showtime was created.

import express, { Request, Response } from "express";
import mongoose from "mongoose";

import Seat from "../models/Seat";
import Showtime from "../models/Showtime";

import { protect } from "../middleware/authMiddleware";

const router = express.Router();

const LOCK_MINUTES = 10;

// POST /api/seat-locks
// body: { showtimeId: string, seatNumbers: string[] }
router.post("/", protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { showtimeId } = req.body;

    const rawSeats = req.body.seatNumbers;

    if (!showtimeId || !mongoose.Types.ObjectId.isValid(showtimeId)) {
      res.status(400).json({ message: "A valid showtimeId is required" });
      return;
    }

    if (!Array.isArray(rawSeats) || rawSeats.length === 0) {
      res.status(400).json({ message: "At least one seat must be selected" });
      return;
    }

    const seatNumbers: string[] = Array.from(
      new Set(rawSeats.map((seat: unknown) => String(seat)))
    );

    // Same layout as the seat map: rows A-L, seats 1-12
    const validSeatLabel = /^[A-L](1[0-2]|[1-9])$/;

    const invalidSeats = seatNumbers.filter(
      (seatNumber) => !validSeatLabel.test(seatNumber)
    );

    if (invalidSeats.length > 0) {
      res.status(400).json({ message: "Invalid seat number", invalidSeats });
      return;
    }

    const showtime = await Showtime.findById(showtimeId);

    if (!showtime) {
      res.status(404).json({ message: "Showtime not found" });
      return;
    }

    // Create any seat records that don't exist yet for this showtime
    const seatPrice = Number(showtime.get("price")) || 0;

    await Seat.bulkWrite(
      seatNumbers.map((seatNumber) => ({
        updateOne: {
          filter: { showtime: showtimeId, seatNumber },
          update: {
            $setOnInsert: {
              row: seatNumber.charAt(0).toUpperCase(),
              seatType: "REGULAR",
              price: seatPrice,
              status: "AVAILABLE",
            },
          },
          upsert: true,
        },
      }))
    );

    const seats = await Seat.find({
      showtime: showtimeId,
      seatNumber: { $in: seatNumbers },
    });

    const now = new Date();

    const unavailable = seats.filter((seat) => {
      if (seat.status === "BOOKED") return true;

      if (seat.status === "LOCKED" && seat.lockedUntil && seat.lockedUntil > now) {
        return true;
      }

      return false;
    });

    if (unavailable.length > 0) {
      res.status(409).json({
        message: "One or more seats are no longer available",
        unavailableSeats: unavailable.map((seat) => seat.seatNumber),
      });
      return;
    }

    const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);

    await Seat.updateMany(
      { showtime: showtimeId, seatNumber: { $in: seatNumbers } },
      { $set: { status: "LOCKED", lockedUntil } }
    );

    res.status(200).json({ message: "Seats locked", lockedUntil, seatNumbers });
  } catch (error) {
    console.error("Seat Lock Error:", error);

    res.status(500).json({ message: "Server error" });
  }
});

export default router;
