import express from "express";

import {
  createTheater,
  getTheaters,
  getTheaterById,
  updateTheater,
  deleteTheater,
} from "../controllers/theaterController.js";

const router = express.Router();

// CREATE
router.post("/", createTheater);

// READ ALL
router.get("/", getTheaters);

// READ ONE
router.get("/:id", getTheaterById);

// UPDATE
router.put("/:id", updateTheater);

// DELETE
router.delete("/:id", deleteTheater);

export default router;
