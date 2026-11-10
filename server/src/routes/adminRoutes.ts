// Save as server/src/routes/adminRoutes.ts
//
// Then in server.ts, next to your other app.use(...) lines (and ABOVE the
// "Route not found" handler), add:
//
//   import adminRoutes from "./routes/adminRoutes";
//   app.use("/api/admin", adminRoutes);
//
// Every route in this file requires a logged-in user whose account has
// role: "admin". The file is self-contained: it does not depend on any
// existing theater or movie controller.

import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Movie from "../models/Movie";
import Theater from "../models/Theater";
import Showtime from "../models/Showtime";
import User from "../models/User";

import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// Reads the logged-in user's id, whichever way the auth middleware stores it
const getUserId = (req: Request): string | undefined => {
  const r = req as any;

  const id = r.userId ?? r.user?.id ?? r.user?._id;

  return id ? String(id) : undefined;
};

const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const user = await User.findById(userId);

    if (!user || user.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    next();
  } catch (error) {
    console.error("requireAdmin Error:", error);

    res.status(500).json({ message: "Server error" });
  }
};

// Everything below needs a valid login AND an admin account
router.use(protect, requireAdmin);

// =============================================
// GET /api/admin/check
// Used by the frontend to decide whether to show admin pages/links
// =============================================
router.get("/check", (_req: Request, res: Response) => {
  res.status(200).json({ isAdmin: true });
});

// =============================================
// THEATERS
// =============================================

interface ScreenInput {
  name: string;
  totalSeats: number;
}

const TIME_SLOTS = ["10:00", "14:00", "18:30", "21:45"];

const DAYS_AHEAD = 7;

const pad = (value: number) => String(value).padStart(2, "0");

// Parses and checks the "screens" the admin typed. Returns null if invalid.
const parseScreens = (raw: unknown): ScreenInput[] | null => {
  if (raw === undefined) {
    return [
      { name: "Screen 1", totalSeats: 144 },
      { name: "Screen 2", totalSeats: 144 },
    ];
  }

  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 10) return null;

  const screens: ScreenInput[] = [];

  for (const item of raw) {
    const name = typeof item?.name === "string" ? item.name.trim() : "";

    const totalSeats = Number(item?.totalSeats);

    if (!name || !Number.isInteger(totalSeats) || totalSeats < 1 || totalSeats > 144) {
      return null;
    }

    screens.push({ name, totalSeats });
  }

  return screens;
};

// GET /api/admin/theaters
router.get("/theaters", async (_req: Request, res: Response) => {
  try {
    const theaters = await Theater.find().sort({ location: 1, name: 1 });

    res.status(200).json({ theaters });
  } catch (error) {
    console.error("Admin Get Theaters Error:", error);

    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/theaters
// body: { name, location, address, screens?: [{ name, totalSeats }], createShowtimes?: boolean }
router.post("/theaters", async (req: Request, res: Response) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    const location =
      typeof req.body.location === "string" ? req.body.location.trim() : "";

    const address =
      typeof req.body.address === "string" ? req.body.address.trim() : "";

    if (!name || !location || !address) {
      res.status(400).json({ message: "Name, location and address are required" });
      return;
    }

    const screens = parseScreens(req.body.screens);

    if (!screens) {
      res.status(400).json({
        message: "Screens must be 1-10 entries, each with a name and 1-144 seats",
      });
      return;
    }

    const duplicate = await Theater.findOne({ name, location });

    if (duplicate) {
      res.status(409).json({ message: "A theater with this name already exists in that location" });
      return;
    }

    const theater = await Theater.create({ name, location, address, screens });

    // Give the new theater showtimes so it appears on the site straight away
    // (the city filter and movie pages are built from showtimes).
    let showtimesCreated = 0;

    if (req.body.createShowtimes !== false) {
      const movies = await Movie.find().sort({ rating: -1 }).limit(5);

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const docs: any[] = [];

      for (const movie of movies) {
        for (let day = 0; day < DAYS_AHEAD; day++) {
          const showDate = new Date(today);

          showDate.setDate(showDate.getDate() + day);

          TIME_SLOTS.forEach((time, slotIndex) => {
            const screen = screens[slotIndex % screens.length] ?? screens[0]!;

            const [hours = 0, minutes = 0] = time.split(":").map(Number);

            docs.push({
              movie: movie._id,
              theater: theater._id,
              screen: screen.name,
              showDate,
              startTime: time,
              endTime: `${pad((hours + 3) % 24)}:${pad(minutes)}`,
              price: 150 + slotIndex * 30,
              totalSeats: screen.totalSeats,
              availableSeats: screen.totalSeats,
              bookingSeats: [],
            });
          });
        }
      }

      if (docs.length > 0) {
        await Showtime.insertMany(docs);

        showtimesCreated = docs.length;
      }
    }

    res.status(201).json({
      message: "Theater created",
      theater,
      showtimesCreated,
    });
  } catch (error) {
    console.error("Admin Create Theater Error:", error);

    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/theaters/:id
// body: any of { name, location, address, screens }
router.put("/theaters/:id", async (req: Request, res: Response) => {
  try {
    const theaterId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
      res.status(400).json({ message: "Invalid theater ID" });
      return;
    }

    const update: Record<string, unknown> = {};

    for (const field of ["name", "location", "address"] as const) {
      const value = req.body[field];

      if (typeof value === "string" && value.trim()) update[field] = value.trim();
    }

    if (req.body.screens !== undefined) {
      const screens = parseScreens(req.body.screens);

      if (!screens) {
        res.status(400).json({
          message: "Screens must be 1-10 entries, each with a name and 1-144 seats",
        });
        return;
      }

      update.screens = screens;
    }

    const theater = await Theater.findByIdAndUpdate(theaterId, update, { new: true });

    if (!theater) {
      res.status(404).json({ message: "Theater not found" });
      return;
    }

    res.status(200).json({ message: "Theater updated", theater });
  } catch (error) {
    console.error("Admin Update Theater Error:", error);

    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/theaters/:id
// A theater that already has showtimes can't be deleted, so bookings and
// movie pages never point at a theater that no longer exists.
router.delete("/theaters/:id", async (req: Request, res: Response) => {
  try {
    const theaterId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
      res.status(400).json({ message: "Invalid theater ID" });
      return;
    }

    const inUse = await Showtime.exists({ theater: theaterId });

    if (inUse) {
      res.status(409).json({
        message: "This theater has showtimes, so it can't be deleted.",
      });
      return;
    }

    const theater = await Theater.findByIdAndDelete(theaterId);

    if (!theater) {
      res.status(404).json({ message: "Theater not found" });
      return;
    }

    res.status(200).json({ message: "Theater deleted" });
  } catch (error) {
    console.error("Admin Delete Theater Error:", error);

    res.status(500).json({ message: "Server error" });
  }
});

// =============================================
// MOVIE POSTERS
// =============================================

// PATCH /api/admin/movies/:id/poster
// body: { poster: string }
router.patch("/movies/:id/poster", async (req: Request, res: Response) => {
  try {
    const movieId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      res.status(400).json({ message: "Invalid movie ID" });
      return;
    }

    const poster = typeof req.body.poster === "string" ? req.body.poster.trim() : "";

    if (!/^https?:\/\/.+/i.test(poster) && !poster.startsWith("/")) {
      res.status(400).json({
        message: "Enter a full image URL (starting with http:// or https://)",
      });
      return;
    }

    const movie = await Movie.findByIdAndUpdate(movieId, { poster }, { new: true });

    if (!movie) {
      res.status(404).json({ message: "Movie not found" });
      return;
    }

    res.status(200).json({ message: "Poster updated", movie });
  } catch (error) {
    console.error("Admin Update Poster Error:", error);

    res.status(500).json({ message: "Server error" });
  }
});

export default router;
