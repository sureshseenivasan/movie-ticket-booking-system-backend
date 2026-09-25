import mongoose, { Document, Schema } from "mongoose";

export interface IShowtime extends Document {
  externalId?: string;
  movie: mongoose.Types.ObjectId;
  theater: mongoose.Types.ObjectId;

  screen: string;

  startTime: string;
  endTime: string;

  showDate: Date;

  price: number;

  totalSeats: number;
  availableSeats: number;

  bookingSeats: string[];
}

const showtimeSchema = new Schema<IShowtime>(
  {
    externalId: {
      type: String,
      unique: true,
      sparse: true
    },
    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true
    },

    theater: {
      type: Schema.Types.ObjectId,
      ref: "Theater",
      required: true
    },

    screen: {
      type: String,
      required: true
    },

    startTime: {
      type: String,
      required: true
    },

    endTime: {
      type: String,
      required: true
    },

    showDate: {
      type: Date,
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0
    },

    bookingSeats: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IShowtime>(
  "Showtime",
  showtimeSchema
);
