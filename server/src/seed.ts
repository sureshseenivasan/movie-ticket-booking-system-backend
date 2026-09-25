import dotenv from "dotenv";

import connectDB from "./config/db";

import Movie from "./models/Movie";
import Theater from "./models/Theater";
import Showtime from "./models/Showtime";
import Seat from "./models/Seat";

import { movies } from "./data/movies";
import { theaters } from "./data/theaters";

dotenv.config();

// How many days ahead (including today) to create showtimes for.
// Computed fresh from the real date every time this script runs, so
// re-running it later never leaves showtimes stuck in the past.
const DAYS_AHEAD = 7;

const TIME_SLOTS = ["10:00", "14:00", "18:30", "21:45"];

// Start of today, in local server time
const startOfToday = (): Date => {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
};

// CREATE SEATS
const createSeats = async (
  showtimeId: any,
  basePrice: number,
  totalSeats: number
) => {
  const seats: any[] = [];
  const seatsPerRow = 12;
  const rows = Math.ceil(totalSeats / seatsPerRow);

  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row);

    for (let seat = 1; seat <= seatsPerRow; seat++) {
      const seatIndex = row * seatsPerRow + seat;

      if (seatIndex > totalSeats) {
        break;
      }

      let seatType: "REGULAR" | "PREMIUM" | "RECLINER" = "REGULAR";
      let price = basePrice;

      // Last 2 rows are PREMIUM
      if (row >= rows - 2) {
        seatType = "PREMIUM";
        price = basePrice + 50;
      }

      // Last row is RECLINER
      if (row === rows - 1) {
        seatType = "RECLINER";
        price = basePrice + 150;
      }

      seats.push({
        showtime: showtimeId,
        seatNumber: `${rowLetter}${seat}`,
        row: rowLetter,
        seatType,
        price,
        status: "AVAILABLE",
      });
    }
  }

  await Seat.insertMany(seats);
  return seats.length;
};

// CREATE SHOWTIMES
// Every movie gets showtimes across the next DAYS_AHEAD days, in
// rotating theaters, computed from today's real date.
const createShowtimes = async (
  moviesData: any[],
  theatersData: any[]
) => {
  const showtimes: any[] = [];

  const today = startOfToday();

  for (let m = 0; m < moviesData.length; m++) {
    const movie = moviesData[m];

    // Each movie plays at up to 2 theaters (rotates through the list)
    const theaterCount = Math.min(2, theatersData.length);

    for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
      const showDate = addDays(today, dayOffset);

      for (let t = 0; t < theaterCount; t++) {
        const theater = theatersData[(m + t) % theatersData.length];

        const screens = theater.screens?.length
          ? theater.screens
          : [{ name: "Screen 1", totalSeats: 144 }];

        TIME_SLOTS.forEach((time, slotIndex) => {
          const screen = screens[slotIndex % screens.length];

          const [hours = 0, minutes = 0] = time.split(":").map(Number);

          const startTime = new Date(showDate);
          startTime.setHours(hours, minutes, 0, 0);

          const endTime = new Date(startTime);
          endTime.setHours(startTime.getHours() + 3);

          const totalSeats = screen.totalSeats || 144;

          showtimes.push({
            movie: movie._id,
            theater: theater._id,
            screen: screen.name,
            showDate,
            startTime: time,
            endTime: `${endTime.getHours().toString().padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`,
            price: 150 + slotIndex * 30,
            totalSeats,
            availableSeats: totalSeats,
            bookingSeats: [],
          });
        });
      }
    }
  }

  const createdShowtimes = await Showtime.insertMany(showtimes);
  return createdShowtimes;
};

// SEED DATABASE
const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("MongoDB Connected");

    // DELETE OLD DATA
    console.log("Deleting old data...");
    await Seat.deleteMany({});
    await Showtime.deleteMany({});
    await Movie.deleteMany({});
    await Theater.deleteMany({});

    // INSERT MOVIES
    console.log("Adding movies...");
    const createdMovies = await Movie.insertMany(movies);
    console.log(`${createdMovies.length} movies added`);

    // INSERT THEATERS
    console.log("Adding theaters...");
    const createdTheaters = await Theater.insertMany(theaters);
    console.log(`${createdTheaters.length} theaters added`);

    // CREATE SHOWTIMES
    console.log(`Creating showtimes for the next ${DAYS_AHEAD} days...`);
    const createdShowtimes = await createShowtimes(
      createdMovies,
      createdTheaters
    );
    console.log(`${createdShowtimes.length} showtimes created`);

    // GENERATE SEATS
    console.log("Generating seats...");
    let totalSeatsCreated = 0;

    for (const showtime of createdShowtimes) {
      const theater = createdTheaters.find(
        (item) => item._id.toString() === showtime.theater.toString()
      );

      if (!theater) {
        console.log("Theater not found");
        continue;
      }

      const seatCount = await createSeats(
        showtime._id,
        showtime.price,
        showtime.totalSeats
      );

      totalSeatsCreated += seatCount;
    }

    console.log(`${totalSeatsCreated} seats created`);
    console.log("=================================");
    console.log("DATABASE SEEDED SUCCESSFULLY! 🎉");
    console.log("=================================");
    console.log(`Movies: ${createdMovies.length}`);
    console.log(`Theaters: ${createdTheaters.length}`);
    console.log(`Showtimes: ${createdShowtimes.length}`);
    console.log(`Seats: ${totalSeatsCreated}`);

    process.exit(0);
  } catch (error) {
    console.error("SEED ERROR:", error);
    process.exit(1);
  }
};

seedDatabase();
