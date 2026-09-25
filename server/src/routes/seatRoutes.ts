import express from "express";

import {
  generateSeats,
  getSeatsByShowtime,
  lockSeats,
  releaseSeats,
} from "../controllers/seatController";


const router = express.Router();


// Generate seats

router.post(
  "/generate/:showtimeId",
  generateSeats
);


// Get seats

router.get(
  "/showtime/:showtimeId",
  getSeatsByShowtime
);


// Lock seats

router.post(
  "/lock",
  lockSeats
);


// Release seats

router.post(
  "/release",
  releaseSeats
);


export default router;
