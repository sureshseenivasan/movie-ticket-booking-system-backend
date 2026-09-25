import dotenv from "dotenv";
import connectDB from "./config/db";
import Showtime from "./models/Showtime";
import showtimes from "./data/showtimes.json";

dotenv.config();

const seedShowtimes = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log("MongoDB connected");

    // Remove existing showtimes
    await Showtime.deleteMany({});

    console.log("Existing showtimes deleted");

    // Insert new showtimes
    const insertedShowtimes = await Showtime.insertMany(showtimes);

    console.log(
      `${insertedShowtimes.length} showtimes inserted successfully`
    );

    process.exit(0);
  } catch (error) {
    console.error("Showtime seed error:", error);

    process.exit(1);
  }
};

seedShowtimes();
