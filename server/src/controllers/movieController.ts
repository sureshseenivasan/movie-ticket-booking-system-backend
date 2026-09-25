
import { Request, Response } from "express";
import Movie from "../models/Movie";
import mongoose from "mongoose";


// CREATE MOVIE
// POST /api/movies


export const createMovie = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      title,
      description,
      genre,
      language,
      duration,
      releaseDate,
      poster,
      trailer,
      rating,
    } = req.body;

    if (
      !title ||
      !description ||
      !genre ||
      !language ||
      !duration ||
      !releaseDate
    ) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    const movie = await Movie.create({
      title,
      description,
      genre,
      language,
      duration,
      releaseDate,
      poster,
      trailer,
      rating,
    });

    res.status(201).json({
      message: "Movie created successfully",
      movie,
    });
  } catch (error) {
    console.error("Create Movie Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// GET ALL MOVIES
// GET /api/movies


export const getMovies = async (
  req: Request,
  res: Response
) => {
  try {
    const movies = await Movie.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error("Get Movies Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// GET SINGLE MOVIE
// GET /api/movies/:id

export const getMovieById = async (
  req: Request,
  res: Response
) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    res.status(200).json({
      movie,
    });
  } catch (error) {
    console.error("Get Movie Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// UPDATE MOVIE
// PUT /api/movies/:id


export const updateMovie = async (
  req: Request,
  res: Response
) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    res.status(200).json({
      message: "Movie updated successfully",
      movie,
    });
  } catch (error) {
    console.error("Update Movie Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// DELETE MOVIE
// DELETE /api/movies/:id


export const deleteMovie = async (
  req: Request,
  res: Response
) => {
  try {
    const movie = await Movie.findByIdAndDelete(
      req.params.id
    );

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    res.status(200).json({
      message: "Movie deleted successfully",
    });
  } catch (error) {
    console.error("Delete Movie Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateMoviePoster = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const movieId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      res.status(400).json({
        message: "Invalid movie ID",
      });
      return;
    }

    const poster = typeof req.body.poster === "string" ? req.body.poster.trim() : "";

    if (!poster) {
      res.status(400).json({
        message: "Poster URL is required",
      });
      return;
    }

    // Basic sanity check: must be a real link or a site-relative path
    const looksValid = /^https?:\/\/.+/i.test(poster) || poster.startsWith("/");

    if (!looksValid) {
      res.status(400).json({
        message: "Enter a full image URL (starting with http:// or https://)",
      });
      return;
    }

    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { poster },
      { new: true }
    );

    if (!movie) {
      res.status(404).json({
        message: "Movie not found",
      });
      return;
    }

    res.status(200).json({
      message: "Poster updated",
      movie,
    });
  } catch (error) {
    console.error("Update Poster Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

