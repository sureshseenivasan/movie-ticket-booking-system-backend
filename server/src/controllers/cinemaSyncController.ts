import { Request, Response } from "express";
import {
  syncCinemaDatabase
} from "../services/cinemaSyncService";

export const syncCinema = async (
  req: Request,
  res: Response
) => {
  try {
    const result =
      await syncCinemaDatabase();

    res.status(200).json({
      success: true,
      message:
        "Cinema database synchronized successfully",
      result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message:
        "Cinema synchronization failed",
      error: error.message
    });
  }
};
