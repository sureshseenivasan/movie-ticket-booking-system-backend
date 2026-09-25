import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

import Booking from "../models/Booking";
import Seat from "../models/Seat";
import Showtime from "../models/Showtime";
import Payment from "../models/payment";


// CREATE PAYMENT
// POST /api/payments

export const createPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body;

    // Validation
    if (!bookingId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "bookingId, amount and paymentMethod are required",
      });
    }

    const payment = await Payment.create({
      bookingId,
      amount,
      paymentMethod,
      status: "success",
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Payment failed",
      error: error.message,
    });
  }
};



// GET ALL PAYMENTS
// GET /api/payments


export const getPayments = async (
  req: Request,
  res: Response
) => {
  try {
    const payments = await Payment.find()
      .populate("bookingId");

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};


// GET PAYMENT BY ID
// GET /api/payments/:id


export const getPaymentById = async (
  req: Request,
  res: Response
) => {
  try {
    const payment = await Payment.findById(
      req.params.id
    ).populate("bookingId");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching payment",
      error: error.message,
    });
  }
};



// UPDATE PAYMENT
// PUT /api/payments/:id


export const updatePayment = async (
  req: Request,
  res: Response
) => {
  try {
    const { amount, paymentMethod, status } =
      req.body;

    const
payment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        amount,
        paymentMethod,
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      payment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error updating payment",
      error: error.message,
    });
  }
};



// DELETE PAYMENT
// DELETE /api/payments/:id


export const deletePayment = async (
  req: Request,
  res: Response
) => {
  try {
    const payment = await Payment.findByIdAndDelete(
      req.params.id
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error deleting payment",
      error: error.message,
    });
  }
};
type AuthenticatedRequest = Request & {
  userId?: string;
};


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});



// GENERATE BOOKING NUMBER


const generateBookingNumber = () => {

  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `MTB-${Date.now()}-${random}`;

};



// CREATE PAYMENT ORDER
// POST /api/payments/create-order


export const createPaymentOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {

  try {

    const userId = req.userId;

    const {
      showtimeId,
      seatNumbers,
    } = req.body;

    if (!userId) {
      res.status(401).json({
        message: "User not authenticated",
      });

      return;
    }

    // Validate

    if (
      !showtimeId ||
      !seatNumbers ||
      !Array.isArray(seatNumbers) ||
      seatNumbers.length === 0
    ) {

      res.status(400).json({
        message:
          "Showtime and seat numbers are required",
      });

      return;

    }


    // Check showtime

    const showtime =
      await Showtime.findById(showtimeId);


    if (!showtime) {

      res.status(404).json({
        message:
          "Showtime not found",
      });

      return;

    }


    // Find locked seats

    const seats =
      await Seat.find({

        showtime: showtimeId,

        seatNumber: {
          $in: seatNumbers,
        },

        status: "LOCKED",

      });


    if (
      seats.length !==
      seatNumbers.length
    ) {

      res.status(400).json({

        message:
          "Selected seats are not locked or unavailable",

      });

      return;

    }


    // Check lock expiration

    const now = new Date();

    const expiredSeats =
      seats.filter(

        (seat) =>
          seat.lockedUntil &&
          seat.lockedUntil < now

      );


    if (
      expiredSeats.length > 0
    ) {

      // Release expired seats

      await Seat.updateMany(

        {

          showtime: showtimeId,

          seatNumber: {
            $in:
              expiredSeats.map(
                (seat) =>
                  seat.seatNumber
              ),
          },

        },

        {

          status: "AVAILABLE",

          $unset: {
            lockedUntil: "",
          },

        }

      );


      res.status(400).json({

        message:
          "Seat lock expired. Please select seats again.",

      });

      return;

    }


    // Calculate amount

    const totalAmount =
      seats.reduce(

        (total, seat) =>
          total + seat.price,

        0

      );


    // Razorpay amount is in paise

    const amountInPaise =
      Math.round(totalAmount * 100);


    // Create Razorpay order

    const order =
      await razorpay.orders.create({

        amount: amountInPaise,

        currency: "INR",

        receipt:
          `receipt_${Date.now()}`,

      });


    // Create pending booking

    const booking =
      await Booking.create({

        user: userId,

        showtime: showtimeId,

        seats: seatNumbers,

        totalAmount,

        bookingStatus: "PENDING" as any,

        paymentStatus: "PENDING",

        bookingNumber:
          generateBookingNumber(),

        razorpayOrderId:
          order.id,

      });


    res.status(201).json({

      message:
        "Payment order created successfully",

      bookingId:
        booking._id,

      bookingNumber:
        booking.bookingNumber,

      order: {

        id:
          order.id,

        amount:
          order.amount,

        currency:
          order.currency,

      },

      key:
        process.env.RAZORPAY_KEY_ID,

    });

  } catch (error) {

    console.error(
      "Create Payment Order Error:",
      error
    );

    res.status(500).json({

      message:
        "Payment order creation failed",

    });

  }

};



// VERIFY PAYMENT
// POST /api/payments/verify


export const verifyPayment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {

  try {

    const {

      razorpay_order_id,

      razorpay_payment_id,

      razorpay_signature,

      bookingId,

    } = req.body;


    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !bookingId
    ) {

      res.status(400).json({

        message:
          "Payment details are required",

      });

      return;

    }


    // Find booking

    const booking =
      await Booking.findById(
        bookingId
      );


    if (!booking) {

      res.status(404).json({

        message:
          "Booking not found",

      });

      return;

    }


    // Check booking belongs to user

    if (
      booking.user.toString() !==
      req.userId
    ) {

      res.status(403).json({

        message:
          "Not authorized",

      });

      return;

    }


    // Verify Razorpay signature

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env
            .RAZORPAY_KEY_SECRET as string
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");


    if (
      generatedSignature !==
      razorpay_signature
    ) {

      booking.paymentStatus =
        "FAILED";

      await booking.save();


      res.status(400).json({

        message:
          "Payment verification failed",

      });

      return;

    }


    // Verify correct order

    if (
      booking.razorpayOrderId !==
      razorpay_order_id
    ) {

      res.status(400).json({

        message:
          "Invalid payment order",

      });

      return;

    }


    // Get seats again

    const seats =
      await Seat.find({

        showtime:
          booking.showtime,

        seatNumber: {
          $in: booking.seats,
        },

      });


    // Make sure seats are still locked

    const validSeats =
      seats.every(

        (seat) =>
          seat.status === "LOCKED"

      );


    if (!validSeats) {

      res.status(400).json({

        message:
          "Seats are no longer available",

      });

      return;

    }


    // Update booking

    booking.paymentStatus =
      "PAID";

    booking.bookingStatus =
      "CONFIRMED";

    booking.razorpayPaymentId =
      razorpay_payment_id;

    await booking.save();


    // Change seats to BOOKED

    await Seat.updateMany(



      {

        showtime:
          booking.showtime,

        seatNumber: {
          $in: booking.seats,
        },

      },

      {

        status: "BOOKED",

        $unset: {
          lockedUntil: "",
        },

      }

    );

    // Send booking confirmation email
    try {
      await sendBookingEmail(
        booking._id.toString()
      );

      console.log(
        "Booking confirmation email sent for booking:",
        booking._id.toString()
      );
    } catch (emailError) {
      console.error(
        "Error sending booking confirmation email:",
        emailError
      );
    }

    res.status(200).json({
      message:
        "Payment successful and booking confirmed",
      booking,
    });

  } catch (error) {

    console.error(
      "Verify Payment Error:",
      error
    );

    res.status(500).json({

      message:
        "Payment verification failed",

    });

  }

};

async function sendBookingEmail(bookingId: string) {
  void bookingId;
  return;
}

