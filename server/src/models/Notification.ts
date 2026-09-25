import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;

  type:
  | "BOOKING_CONFIRMED"
  | "SHOWTIME_CHANGED"
  | "BOOKING_REMINDER"
  | "UPCOMING_MOVIE";

  title: string;
  message: string;

  booking?: mongoose.Types.ObjectId;
  movie?: mongoose.Types.ObjectId;
  showtime?: mongoose.Types.ObjectId;

  read: boolean;

  sentEmail: boolean;
  sentSMS: boolean;
}

const notificationSchema =
  new Schema<INotification>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      type: {
        type: String,
        enum: [
          "BOOKING_CONFIRMED",
          "SHOWTIME_CHANGED",
          "BOOKING_REMINDER",
          "UPCOMING_MOVIE"
        ],
        required: true
      },

      title: {
        type: String,
        required: true
      },

      message: {
        type: String,
        required: true
      },

      booking: {
        type: Schema.Types.ObjectId,
        ref: "Booking"
      },

      movie: {
        type: Schema.Types.ObjectId,
        ref: "Movie"
      },

      showtime: {
        type: Schema.Types.ObjectId,
        ref: "Showtime"
      },

      read: {
        type: Boolean,
        default: false
      },

      sentEmail: {
        type: Boolean,
        default: false
      },

      sentSMS: {
        type: Boolean,
        default: false
      }
    },
    {
      timestamps: true
    }
  );

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
