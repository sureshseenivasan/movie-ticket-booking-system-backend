import { Request, Response } from "express";
import Showtime from "../models/Showtime";


// CREATE SHOWTIME

export const createShowtime = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      movie,
      theater,
      screen,
      showDate,
      startTime,
      endTime,
      price,
      availableSeats,
      totalSeats,
    } = req.body;

    const showtime = await Showtime.create({
      movie,
      theater,
      screen,
      showDate,
      startTime,
      endTime,
      price,
      availableSeats,
      totalSeats,
    });

    res.status(201).json({
      success: true,
      message: "Showtime created successfully",
      showtime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating showtime",
      error,
    });
  }
};


// GET ALL SHOWTIMES

export const getShowtimes = async (
  req: Request,
  res: Response
) => {
  try {
    const showtimes = await Showtime.find()
      .populate("movie")
      .populate("theater");

    res.status(200).json({
      success: true,
      count: showtimes.length,
      showtimes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching showtimes",
      error,
    });
  }
};


// GET SHOWTIME BY ID

export const getShowtimeById = async (
  req: Request,
  res: Response
) => {
  try {
    const showtime = await Showtime.findById(
      req.params.id
    )
      .populate("movie")
      .populate("theater");

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    res.status(200).json({
      success: true,
      showtime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching showtime",
      error,
    });
  }
};


// UPDATE SHOWTIME

export const updateShowtime = async (
  req: Request,
  res: Response
) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Showtime updated successfully",
      showtime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating showtime",
      error,
    });
  }
};


// DELETE SHOWTIME

export const deleteShowtime = async (
  req: Request,
  res: Response
) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(
      req.params.id
    );

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Showtime deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting showtime",
      error,
    });
  }
};
