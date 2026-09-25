import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: "card" | "upi" | "cash";
  status: "pending" | "success" | "failed";
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    paymentMethod: {
      type: String,
      enum: ["card", "upi", "cash"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);

export default Payment;
