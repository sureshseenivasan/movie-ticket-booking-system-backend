import { Request, Response } from "express";
import Theater from "../models/Theater.js";


// CREATE THEATER
// POST /api/theaters


export const createTheater = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, location, address, screens } = req.body;

    const theater = await Theater.create({
      name,
      location,
      address,
      screens,
    });

    res.status(201).json({
      success: true,
      message: "Theater created successfully",
      data: theater,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create theater",
      error,
    });
  }
};


// GET ALL THEATERS
// GET /api/theaters


export const getTheaters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const theaters = await Theater.find();

    res.status(200).json({
      success: true,
      count: theaters.length,
      data: theaters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch theaters",
      error,
    });
  }
};


// GET SINGLE THEATER
// GET /api/theaters/:id


export const getTheaterById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const theater = await Theater.findById(req.params.id);

    if (!theater) {
      res.status(404).json({
        success: false,
        message: "Theater not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: theater,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch theater",
      error,
    });
  }
};


// UPDATE THEATER
// PUT /api/theaters/:id


export const updateTheater = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const theater = await Theater.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!theater) {
      res.status(404).json({
        success: false,
        message: "Theater not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Theater updated successfully",
      data: theater,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update theater",
      error,
    });
  }
};


// DELETE THEATER
// DELETE /api/theaters/:id


export const deleteTheater = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const theater = await Theater.findByIdAndDelete(req.params.id);

    if (!theater) {
      res.status(404).json({
        success: false,
        message: "Theater not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Theater deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete theater",
      error,
    });
  }
};
