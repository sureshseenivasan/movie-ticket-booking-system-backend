import mongoose, { Schema, Document } from "mongoose";

export interface IMovie extends Document {
  externalId?: string;

  title: string;

  description: string;

  genre: string[];

  language: string;

  releaseDate: Date;

  duration: number;

  poster: string;

  backdrop?: string;

  rating: number;

  trailer?: string;


}

const movieSchema = new Schema<IMovie>(
  {
    externalId: {
      type: String,
      unique: true,
      sparse: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    genre: {
      type: [String],
      required: true
    },

    language: {
      type: String,
      required: true
    },

    releaseDate: {
      type: Date,
      required: true
    },

    duration: {
      type: Number,
      required: true
    },

    poster: {
      type: String,
      default: ""
    },

    backdrop: {
      type: String,
      default: ""
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },

    trailer: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Movie = mongoose.model<IMovie>(
  "Movie",
  movieSchema
);

export default Movie;
