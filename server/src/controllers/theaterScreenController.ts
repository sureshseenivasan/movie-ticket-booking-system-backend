import { Request, Response } from "express";
import TheaterScreen from "../models/TheaterScreen";


// GET ALL SCREENS
export const getScreens = async (
  req: Request,
  res: Response
) => {
  try {
    const screens = await TheaterScreen.find()
      .populate("theater");

    res.status(200).json({
      success: true,
      count: screens.length,
      screens
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// GET SCREEN BY ID
export const getScreenById = async (
  req: Request,
  res: Response
) => {
  try {
    const screen = await TheaterScreen.findById(
      req.params.id
    ).populate("theater");

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: "Screen not found"
      });
    }

    res.status(200).json({
      success: true,
      screen
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// CREATE SCREEN
export const createScreen = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      theater,
      screenName,
      seats
    } = req.body;

    if (!theater || !screenName || !seats) {
      return res.status(400).json({
        success: false,
        message: "theater, screenName and seats are required"
      });
    }

    const existingScreen =
      await TheaterScreen.findOne({
        theater,
        screenName
      });

    if (existingScreen) {
      return res.status(400).json({
        success: false,
        message: "Screen already exists"
      });
    }

    const screen = await TheaterScreen.create({
      theater,
      screenName,
      totalSeats: seats.length,
      seats
    });

    res.status(201).json({
      success: true,
      message: "Screen created successfully",
      screen
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// UPDATE SCREEN
export const updateScreen = async (
  req: Request,
  res: Response
) => {
  try {
    const screen =
      await TheaterScreen.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: "Screen not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Screen updated successfully",
      screen
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// DELETE SCREEN
export const deleteScreen = async (
  req: Request,
  res: Response
) => {
  try {
    const screen =
      await TheaterScreen.findByIdAndDelete(
        req.params.id
      );

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: "Screen not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Screen deleted successfully"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
