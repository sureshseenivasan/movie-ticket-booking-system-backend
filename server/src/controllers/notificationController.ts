import { Request, Response } from "express";

import Booking from "../models/Booking";
import transporter from "../config/email";
import Notification from "../models/Notification";

export const getMyNotifications =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const notifications =
        await Notification.find({
          user: (req as any).user.id
        })
          .sort({
            createdAt: -1
          });

      res.json({
        success: true,
        notifications
      });

    } catch (error: any) {

      res.status(500).json({
        success: false,
        message: error.message
      });

    }
  };

export const markNotificationRead =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: req.params.id,

            user: (req as any).user.id
          } as any,

          {
            read: true
          },

          {
            new: true
          }
        );

      if (!notification) {

        return res.status(404).json({
          success: false,
          message:
            "Notification not found"
        });

      }

      res.json({
        success: true,
        notification
      });

    } catch (error: any) {

      res.status(500).json({
        success: false,
        message: error.message
      });

    }
  };
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}



// SEND BOOKING CONFIRMATION EMAIL
// POST /api/notifications/booking/:bookingId


export const sendBookingConfirmation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("user", "name email")
      .populate({
        path: "showtime",
        populate: [
          {
            path: "movie",
          },
          {
            path: "theater",
          },
        ],
      });

    if (!booking) {
      res.status(404).json({
        message: "Booking not found",
      });

      return;
    }


    // Check user owns booking

    const bookingUser = booking.user as any;

    if (
      bookingUser._id.toString() !==
      req.userId
    ) {
      res.status(403).json({
        message: "Not authorized",
      });

      return;
    }


    // Check payment

    if (booking.paymentStatus !== "PAID") {
      res.status(400).json({
        message:
          "Booking payment is not completed",
      });

      return;
    }


    const showtime = booking.showtime as any;

    const movie = showtime.movie;

    const theater = showtime.theater;


    // =========================================
    // EMAIL CONTENT
    // =========================================

    const mailOptions = {
      from: process.env.EMAIL_USER,

      to: bookingUser.email,

      subject:
        `🎟️ Booking Confirmed - ${booking.bookingNumber}`,

      html: `

      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 10px;
      ">

        <h1 style="
          text-align: center;
          color: #e50914;
        ">
          🎬 Movie Ticket Booking
        </h1>


        <h2>
          Booking Confirmed! 🎉
        </h2>


        <p>
          Hello <strong>${bookingUser.name}</strong>,
        </p>


        <p>
          Your movie ticket booking has been
          successfully confirmed.
        </p>


        <hr />


        <h3>
          🎬 Movie Details
        </h3>


        <p>
          <strong>Movie:</strong>
          ${movie.title}
        </p>


        <p>
          <strong>Theater:</strong>
          ${theater.name}
        </p>


        <p>
          <strong>Screen:</strong>
          ${showtime.screen}
        </p>


        <p>
          <strong>Date:</strong>
          ${new Date(
        showtime.showDate
      ).toDateString()}
        </p>


        <p>
          <strong>Time:</strong>
          ${showtime.showTime}
        </p>


        <hr />


        <h3>
          💺 Seat Details
        </h3>


        <p>
          <strong>Seats:</strong>
          ${booking.seats.join(", ")}
        </p>


        <p>
          <strong>Total Amount:</strong>
          ₹${booking.totalAmount}
        </p>


        <p>
          <strong>Payment:</strong>
          PAID
        </p>


        <hr />


        <h3>
          🎟️ Booking Details
        </h3>


        <p>
          <strong>Booking Number:</strong>
          ${booking.bookingNumber}
        </p>


        <p>
          Please show this booking confirmation
          at the theater.
        </p>


        <hr />


        <p style="
          text-align: center;
          color: gray;
        ">
          Thank you for booking with us! 🎬
        </p>

      </div>

      `,
    };



    // SEND EMAIL


    await transporter.sendMail(
      mailOptions
    );


    res.status(200).json({
      message:
        "Booking confirmation email sent successfully",
    });

  } catch (error) {
    console.error(
      "Email Error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to send booking confirmation email",
    });
  }
};
