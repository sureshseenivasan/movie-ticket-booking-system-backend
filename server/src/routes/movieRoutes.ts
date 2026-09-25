import express from "express";

import {
  createMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
} from "../controllers/movieController";
import { updateMoviePoster } from "../controllers/movieController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", createMovie);

router.get("/", getMovies);

router.get("/:id", getMovieById);

router.put("/:id", updateMovie);

router.delete("/:id", deleteMovie);
router.patch("/:id/poster", protect, updateMoviePoster);

export default router;
