import mongoose, { Document, Schema } from "mongoose";

export interface ISeat {
  seatNumber: string;
  row: string;
  number: number;
  type: "REGULAR" | "PREMIUM" | "VIP";
  price: number;
  status: "AVAILABLE" | "BLOCKED";
}

export interface ITheaterScreen extends Document {
  theater: mongoose.Types.ObjectId;
  screenName: string;
  totalSeats: number;
  seats: ISeat[];
}

const seatSchema = new Schema<ISeat>(
  {
    seatNumber: {
      type: String,
      required: true
    },

    row: {
      type: String,
      required: true
    },

    number: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: ["REGULAR", "PREMIUM", "VIP"],
      default: "REGULAR"
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "BLOCKED"],
      default: "AVAILABLE"
    }
  },
  {
    _id: false
  }
);

const theaterScreenSchema = new Schema<ITheaterScreen>(
  {
    theater: {
      type: Schema.Types.ObjectId,
      ref: "Theater",
      required: true
    },

    screenName: {
      type: String,
      required: true
    },

    totalSeats: {
      type: Number,
      required: true
    },

    seats: {
      type: [seatSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ITheaterScreen>(
  "TheaterScreen",
  theaterScreenSchema
);
