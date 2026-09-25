import mongoose, { Document, Schema } from "mongoose";

export interface ISeat extends Document {
  showtime: mongoose.Types.ObjectId;

  seatNumber: string;

  row: string;

  seatType: "REGULAR" | "PREMIUM" | "RECLINER";

  price: number;

  status: "AVAILABLE" | "LOCKED" | "BOOKED";

  lockedUntil?: Date;
}

const seatSchema = new Schema<ISeat>(
  {
    showtime: {
      type: Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },

    seatNumber: {
      type: String,
      required: true,
    },

    row: {
      type: String,
      required: true,
    },

    seatType: {
      type: String,
      enum: ["REGULAR", "PREMIUM", "RECLINER"],
      default: "REGULAR",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "LOCKED", "BOOKED"],
      default: "AVAILABLE",
    },

    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate seat numbers for the same showtime
seatSchema.index(
  { showtime: 1, seatNumber: 1 },
  { unique: true }
);

const Seat = mongoose.model<ISeat>(
  "Seat",
  seatSchema
);

export default Seat;
