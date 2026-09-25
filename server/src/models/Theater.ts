import mongoose, { Document, Schema } from "mongoose";

export interface ITheater extends Document {
  externalID? : string
  name: string;
  location: string;
  address: string;
  screens: {
    name: string;
    totalSeats: number;
  }[];
}

const theaterSchema = new Schema<ITheater>(
  {

    externalID: {
      type: String,
      unique: true,
      sparse: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    screens: [
      {
        name: {
          type: String,
          required: true,
        },

        totalSeats: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Theater = mongoose.model<ITheater>("Theater", theaterSchema);

export default Theater;
