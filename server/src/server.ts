import dotenv from "dotenv";
dotenv.config();

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import movieRoutes from "./routes/movieRoutes";
import theaterRoutes from "./routes/theaterRoutes";
import showtimeRoutes from "./routes/showtimeRoutes";
import seatRoutes from "./routes/seatRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import theaterScreenRoutes from "./routes/theaterScreenRoutes"

import { startCinemaSyncJob } from "./jobs/cinemaSyncJob";
import cinemaSyncRoutes
  from "./routes/cinemaSyncRoutes";
import {
  startNotificationJob
} from "./jobs/notificationJob";


const app = express();


// MIDDLEWARE


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// HOME ROUTE


app.get("/", (req, res) => {
  res.json({
    message: "Movie Ticket Booking API is running!",
  });
});


// AUTH ROUTES


app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/theaters", theaterRoutes);
app.use("/api/showtimes",showtimeRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/theater-screens",theaterScreenRoutes)
app.use( "/api/cinema", cinemaSyncRoutes );
//ERROR HANDLER
app.use(( req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});


//GLOBAL ERROR HANDLER
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong!"
  });
});


// START SERVER


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    startCinemaSyncJob();
    startNotificationJob();


    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
