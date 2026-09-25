import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;

  showtime: mongoose.Types.ObjectId;

  seats: string[];

  totalAmount: number;

  bookingStatus: "CONFIRMED" | "CANCELLED";

  paymentStatus: "PENDING" | "PAID" | "FAILED";

  bookingNumber: string;

  razorpayPaymentId?: string;
  razorpayOrderId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    showtime: {
      type: Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },

    seats: [
      {
        type: String,
        required: true,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingStatus: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED"],
      default: "CONFIRMED",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    bookingNumber: {
      type: String,
      required: true,
      unique: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model<IBooking>(
  "Booking",
  bookingSchema
);

export default Booking;
