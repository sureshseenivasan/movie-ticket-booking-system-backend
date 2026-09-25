import { Request, Response } from "express";

import Seat from "../models/Seat";
import Showtime from "../models/Showtime";



// GENERATE SEATS FOR A SHOWTIME
// POST /api/seats/generate/:showtimeId


export const generateSeats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    const { showtimeId } = req.params;

    if (typeof showtimeId !== "string") {
      res.status(400).json({
        message: "Invalid showtime ID",
      });

      return;
    }

    const showtime = await Showtime.findById(
      showtimeId
    );

    if (!showtime) {
      res.status(404).json({
        message: "Showtime not found",
      });

      return;
    }

    // Check if seats already exist

    const existingSeats = await Seat.find({
      showtime: showtimeId,
    });

    if (existingSeats.length > 0) {
      res.status(400).json({
        message:
          "Seats already generated for this showtime",
      });

      return;
    }


    const seats = [];

    // Theater layout

    const rows = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",

    ];

    const seatsPerRow = 10;


    for (let i = 0; i < rows.length; i++) {

      for (
        let seatNumber = 1;
        seatNumber <= seatsPerRow;
        seatNumber++
      ) {

        const row = rows[i];

        const seatType =
          i >= 5
            ? "PREMIUM"
            : "REGULAR";

        const price =
          seatType === "PREMIUM"
            ? showtime.price + 50
            : showtime.price;


        seats.push({
          showtime: showtimeId,

          seatNumber:
            `${row}${seatNumber}`,

          row,

          seatType,

          price,

          status: "AVAILABLE",
        });
      }
    }


    const createdSeats =
      await Seat.insertMany(seats);


    res.status(201).json({
      message:
        "Seats generated successfully",

      totalSeats:
        createdSeats.length,

      seats: createdSeats,
    });

  } catch (error) {

    console.error(
      "Generate Seats Error:",
      error
    );

    res.status(500).json({
      message:
        "Server error",
    });

  }
};



// GET SEATS BY SHOWTIME
// GET /api/seats/showtime/:showtimeId

export const getSeatsByShowtime = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const { showtimeId } =
      req.params;

    if (typeof showtimeId !== "string") {
      res.status(400).json({
        message: "Invalid showtime ID",
      });

      return;
    }


    // Unlock expired locked seats

    await Seat.updateMany(
      {
        showtime: showtimeId,

        status: "LOCKED",

        lockedUntil: {
          $lt: new Date(),
        },
      },

      {
        status: "AVAILABLE",

        $unset: {
          lockedUntil: "",
        },
      }
    );


    const seats =
      await Seat.find({
        showtime: showtimeId,
      }).sort({
        seatNumber: 1,
      });


    res.status(200).json({

      count: seats.length,

      seats,

    });

  } catch (error) {

    console.error(
      "Get Seats Error:",
      error
    );

    res.status(500).json({
      message:
        "Server error",
    });

  }

};



// LOCK SELECTED SEATS
// POST /api/seats/lock// =======================================

export const lockSeats = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const {
      showtimeId,
      seatNumbers,
    } = req.body;


    if (
      !showtimeId ||
      !seatNumbers ||
      seatNumbers.length === 0
    ) {

      res.status(400).json({
        message:
          "Showtime and seat numbers are required",
      });

      return;
    }


    // Unlock expired seats

    await Seat.updateMany(

      {
        status: "LOCKED",

        lockedUntil: {
          $lt: new Date(),
        },
      },

      {
        status: "AVAILABLE",

        $unset: {
          lockedUntil: "",
        },
      }

    );


    const seats = await Seat.find({

      showtime: showtimeId,

      seatNumber: {
        $in: seatNumbers,
      },

    });


    if (
      seats.length !== seatNumbers.length
    ) {

      res.status(404).json({
        message:
          "One or more seats not found",
      });

      return;
    }


    const unavailableSeats =
      seats.filter(
        (seat) =>
          seat.status !== "AVAILABLE"
      );


    if (
      unavailableSeats.length > 0
    ) {

      res.status(400).json({

        message:
          "One or more seats are unavailable",

        unavailableSeats:
          unavailableSeats.map(
            (seat) =>
              seat.seatNumber
          ),

      });

      return;
    }


    // Lock for 5 minutes

    const lockedUntil =
      new Date(
        Date.now() + 5 * 60 * 1000
      );


    await Seat.updateMany(

      {

        showtime: showtimeId,

        seatNumber: {
          $in: seatNumbers,
        },

      },

      {

        status: "LOCKED",

        lockedUntil,

      }

    );


    const lockedSeats =
      await Seat.find({

        showtime: showtimeId,

        seatNumber: {
          $in: seatNumbers,
        },

      });


    res.status(200).json({

      message:
        "Seats locked successfully",

      lockedUntil,

      seats: lockedSeats,

    });

  } catch (error) {

    console.error(
      "Lock Seats Error:",
      error
    );

    res.status(500).json({
      message:
        "Server error",
    });

  }

};



// RELEASE SEATS
// POST /api/seats/release


export const releaseSeats = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const {
      showtimeId,
      seatNumbers,
    } = req.body;


    await Seat.updateMany(

      {

        showtime: showtimeId,

        seatNumber: {
          $in: seatNumbers,
        },

        status: "LOCKED",

      },

      {

        status: "AVAILABLE",

        $unset: {
          lockedUntil: "",
        },

      }

    );


    res.status(200).json({
      message:
        "Seats released successfully",
    });

  } catch (error) {

    console.error(
      "Release Seats Error:",
      error
    );

    res.status(500).json({
      message:
        "Server error",
    });

  }

};
