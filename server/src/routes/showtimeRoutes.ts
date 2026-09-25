import express from "express";

import {
  createShowtime,
  getShowtimes,
  getShowtimeById,
  updateShowtime,
  deleteShowtime,
} from "../controllers/showtimeController";

const router = express.Router();


// CREATE SHOWTIME
router.post("/", createShowtime);


// GET ALL SHOWTIMES
router.get("/", getShowtimes);


// GET SHOWTIME BY ID
router.get("/:id", getShowtimeById);


// UPDATE SHOWTIME
router.put("/:id", updateShowtime);


// DELETE SHOWTIME
router.delete("/:id", deleteShowtime);


export default router;
