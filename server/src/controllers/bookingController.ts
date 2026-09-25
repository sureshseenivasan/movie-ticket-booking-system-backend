import { Request, Response } from "express";
import mongoose from "mongoose";

import Booking from "../models/Booking";
import Seat from "../models/Seat";
import Showtime from "../models/Showtime";
import {
  formatShowSlot,
  formatTheaterLocation,
  normalizePhone,
  sendBookingEmail,
  sendBookingSms,
  TicketInfo,
} from "../services/notificationService";

type AuthenticatedRequest = Request & {
  userId: string;
};

// Reads the logged-in user's id, whichever way the auth middleware stores it:
// req.userId, req.user.id or req.user._id
const getUserId = (req: Request): string | undefined => {
  const r = req as any;

  const id = r.userId ?? r.user?.id ?? r.user?._id;

  return id ? String(id) : undefined;
};

// =============================================
// GENERATE BOOKING NUMBER
// =============================================

const generateBookingNumber = (): string => {
  const random = Math.floor(100000 + Math.random() * 900000);

  return `MTB-${Date.now()}-${random}`;
};

// =============================================
// CREATE BOOKING
// POST /api/bookings
// body: { showtimeId: string, seatNumbers: string[] }
// =============================================

export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({
        message: "Not authenticated (userId missing on request)",
      });
      return;
    }

    const { showtimeId } = req.body;

    // Accept "seatNumbers" (preferred) or "seats" from the client
    const rawSeats = req.body.seatNumbers ?? req.body.seats;

    // ---------- VALIDATION ----------

    if (!showtimeId || !mongoose.Types.ObjectId.isValid(showtimeId)) {
      res.status(400).json({
        message: "A valid showtime ID is required",
      });
      return;
    }

    if (!Array.isArray(rawSeats) || rawSeats.length === 0) {
      res.status(400).json({
        message: "At least one seat must be selected",
      });
      return;
    }

    // Remove duplicates like ["A1", "A1"]
    const seatNumbers: string[] = Array.from(
      new Set(rawSeats.map((seat: unknown) => String(seat)))
    );

    // ---------- CHECK SHOWTIME ----------

    const showtime = await Showtime.findById(showtimeId);

    if (!showtime) {
      res.status(404).json({
        message: "Showtime not found",
      });
      return;
    }

    // ---------- CREATE MISSING SEAT DOCUMENTS ----------
    // The seat grid is drawn on the frontend, so Seat documents may not
    // exist yet. Create any that are missing for this showtime.

    // Same layout as SeatLayout.tsx: rows A-J, seats 1-10
    // Same layout as SeatLayout.tsx: rows A-L, seats 1-12
    const validSeatLabel = /^[A-L](1[0-2]|[1-9])$/;

    const invalidSeats = seatNumbers.filter(
      (seatNumber) => !validSeatLabel.test(seatNumber)
    );

    if (invalidSeats.length > 0) {
      res.status(400).json({
        message: "Invalid seat number",
        invalidSeats,
      });
      return;
    }

    const seatPrice = Number(showtime.get("price")) || 0;

    await Seat.bulkWrite(
      seatNumbers.map((seatNumber) => ({
        updateOne: {
          filter: { showtime: showtimeId, seatNumber },
          update: {
            $setOnInsert: {
              row: seatNumber.match(/^[A-Za-z]+/)![0].toUpperCase(),
              seatType: "REGULAR",
              price: seatPrice,
              status: "AVAILABLE",
            },
          },
          upsert: true,
        },
      }))
    );

    // ---------- GET SELECTED SEATS ----------

    const seats = await Seat.find({
      showtime: showtimeId,
      seatNumber: { $in: seatNumbers },
    });

    if (seats.length !== seatNumbers.length) {
      const foundSeatNumbers = seats.map((seat) => seat.seatNumber);

      res.status(400).json({
        message: "One or more seats do not exist",
        missingSeats: seatNumbers.filter(
          (seatNumber) => !foundSeatNumbers.includes(seatNumber)
        ),
      });
      return;
    }

    // ---------- CHECK SEAT AVAILABILITY ----------

    const now = new Date();

    // Already booked seats
    const bookedSeats = seats.filter((seat) => seat.status === "BOOKED");

    if (bookedSeats.length > 0) {
      res.status(409).json({
        message: "One or more seats are already booked",
        unavailableSeats: bookedSeats.map((seat) => seat.seatNumber),
      });
      return;
    }

    // Seats with an active lock held by a different user.
    // (Only applies if your Seat schema has a "lockedBy" field;
    //  otherwise lockOwner is undefined and this check is skipped.)
    const lockedByOthers = seats.filter((seat) => {
      const lockIsActive =
        seat.status === "LOCKED" && seat.lockedUntil && seat.lockedUntil > now;

      const lockOwner = seat.get("lockedBy");

      return lockIsActive && lockOwner && lockOwner.toString() !== userId;
    });

    if (lockedByOthers.length > 0) {
      res.status(409).json({
        message: "One or more seats are being held by another user",
        unavailableSeats: lockedByOthers.map((seat) => seat.seatNumber),
      });
      return;
    }

    // AVAILABLE seats, your own active locks, and expired locks
    // are all allowed to be booked.

    // ---------- CALCULATE TOTAL PRICE ----------

    const totalAmount = seats.reduce((total, seat) => total + seat.price, 0);

    // ---------- CREATE BOOKING ----------

    const booking = await Booking.create({
      user: userId,
      showtime: showtimeId,
      seats: seatNumbers,
      totalAmount,
      bookingStatus: "CONFIRMED",
      paymentStatus: "PENDING",
      bookingNumber: generateBookingNumber(),
    });

    // ---------- MARK SEATS AS BOOKED ----------

    await Seat.updateMany(
      {
        showtime: showtimeId,
        seatNumber: { $in: seatNumbers },
      },
      {
        $set: { status: "BOOKED" },
        $unset: { lockedUntil: "", lockedBy: "" },
      }
    );

    // Keep the showtime's bookingSeats / availableSeats in sync
    // (the seat map reads bookingSeats to show booked seats)
    try {
      await Showtime.updateOne(
        { _id: showtimeId },
        {
          $addToSet: { bookingSeats: { $each: seatNumbers } },
          $inc: { availableSeats: -seatNumbers.length },
        }
      );
    } catch (syncError) {
      console.error("Could not sync Showtime.bookingSeats:", syncError);
    }

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);

    res.status(500).json({
      message: "Server error",
      // shown only outside production, so you can see the real cause
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : (error as Error).message,
    });
  }
};

// =============================================
// GET MY BOOKINGS
// GET /api/bookings/my-bookings
// =============================================

export const getMyBookings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({
        message: "Not authenticated (userId missing on request)",
      });
      return;
    }

    const bookings = await Booking.find({
      user: userId,
    })
      .populate({
        path: "showtime",
        populate: [{ path: "movie" }, { path: "theater" }],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get Bookings Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =============================================
// GET BOOKING BY ID
// GET /api/bookings/:id
// =============================================

export const getBookingById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // req.params.id can be typed as string | string[] in newer Express types
    const bookingId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({
        message: "Invalid booking ID",
      });
      return;
    }

    const booking = await Booking.findById(bookingId)
      .populate("user", "-password")
      .populate({
        path: "showtime",
        populate: [{ path: "movie" }, { path: "theater" }],
      });

    if (!booking) {
      res.status(404).json({
        message: "Booking not found",
      });
      return;
    }

    // Ensure user owns booking.
    // "user" is populated here, so read its _id instead of calling
    // toString() on the whole document.
    const owner = booking.user as any;

    const ownerId = String(owner?._id ?? owner);

    if (ownerId !== getUserId(req)) {
      res.status(403).json({
        message: "Not authorized",
      });
      return;
    }

    res.status(200).json({
      booking,
    });
  } catch (error) {
    console.error("Get Booking Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =============================================
// CANCEL BOOKING
// PUT /api/bookings/:id/cancel
// =============================================

export const cancelBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // req.params.id can be typed as string | string[] in newer Express types
    const bookingId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({
        message: "Invalid booking ID",
      });
      return;
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      res.status(404).json({
        message: "Booking not found",
      });
      return;
    }

    // Ensure user owns booking
    if (booking.user.toString() !== getUserId(req)) {
      res.status(403).json({
        message: "Not authorized",
      });
      return;
    }

    // Check already cancelled
    if (booking.bookingStatus === "CANCELLED") {
      res.status(400).json({
        message: "Booking is already cancelled",
      });
      return;
    }

    // ---------- CANCEL BOOKING ----------

    booking.bookingStatus = "CANCELLED";

    await booking.save();

    // ---------- RELEASE SEATS ----------

    await Seat.updateMany(
      {
        showtime: booking.showtime,
        seatNumber: { $in: booking.seats },
      },
      {
        $set: { status: "AVAILABLE" },
        $unset: { lockedUntil: "", lockedBy: "" },
      }
    );

    await Showtime.updateOne(
      { _id: booking.showtime },
      {
        $pull: { bookingSeats: { $in: booking.seats } },
        $inc: { availableSeats: booking.seats.length },
      }
    );

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =============================================
// SEND BOOKING DETAILS BY EMAIL / SMS
// POST /api/bookings/:id/notify
// body: { email?: string, phone?: string }
// =============================================

export const sendBookingNotification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const bookingId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({
        message: "Invalid booking ID",
      });
      return;
    }

    const booking = await Booking.findById(bookingId).populate({
      path: "showtime",
      populate: [{ path: "movie" }, { path: "theater" }],
    });

    if (!booking) {
      res.status(404).json({
        message: "Booking not found",
      });
      return;
    }

    // Only the owner of the booking can send its details
    if (booking.user.toString() !== getUserId(req)) {
      res.status(403).json({
        message: "Not authorized",
      });
      return;
    }

    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : "";

    const phoneInput =
      typeof req.body.phone === "string" ? req.body.phone.trim() : "";

    if (!email && !phoneInput) {
      res.status(400).json({
        message: "Provide an email address or a phone number",
      });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        message: "Invalid email address",
      });
      return;
    }

    const phone = phoneInput ? normalizePhone(phoneInput) : null;

    if (phoneInput && !phone) {
      res.status(400).json({
        message: "Invalid phone number",
      });
      return;
    }

    // ---------- BUILD TICKET DETAILS ----------

    const b = booking as any;

    const showtime =
      b.showtime && typeof b.showtime === "object" ? b.showtime : null;

    const ticket: TicketInfo = {
      bookingNumber: b.bookingNumber ?? String(b._id),
      movieTitle: showtime?.movie?.title ?? "Movie",
      theaterName: [
        showtime?.theater?.name ?? "Theater",
        formatTheaterLocation(showtime?.theater),
      ]
        .filter(Boolean)
        .join(", "),
      screen: showtime?.screen ? String(showtime.screen) : undefined,
      showTime: formatShowSlot(showtime),
      seats: b.seats ?? [],
      totalAmount: b.totalAmount ?? 0,
    };

    // ---------- SEND ----------

    const isProduction = process.env.NODE_ENV === "production";

    const sent: string[] = [];
    const failed: string[] = [];
    const details: string[] = [];

    if (email) {
      try {
        await sendBookingEmail(email, ticket);
        sent.push("email");
      } catch (error) {
        console.error("Send Email Error:", error);
        failed.push("email");
        details.push((error as Error).message);
      }
    }

    if (phone) {
      try {
        await sendBookingSms(phone, ticket);
        sent.push("SMS");
      } catch (error) {
        console.error("Send SMS Error:", error);
        failed.push("SMS");
        details.push((error as Error).message);
      }
    }

    if (failed.length > 0) {
      res.status(502).json({
        message:
          `Could not send ${failed.join(" and ")}` +
          (isProduction ? "" : `: ${details.join("; ")}`),
        sent,
        failed,
      });
      return;
    }

    res.status(200).json({
      message: `Booking details sent by ${sent.join(" and ")}`,
      sent,
    });
  } catch (error) {
    console.error("Notify Booking Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
