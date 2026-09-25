import "dotenv/config";
import connectDB from "../src/config/db";
import Movie from "../src/models/Movie";
import Theater from "../src/models/Theater";
import Showtime from "../src/models/Showtime";

// How many days ahead (including today) to create showtimes for
const DAYS_AHEAD = 7;

// Slots shown each day, and the price added to the base price for each
const TIME_SLOTS = [
  { time: "10:00", priceAdd: 0 },
  { time: "14:00", priceAdd: 30 },
  { time: "18:30", priceAdd: 50 },
  { time: "21:45", priceAdd: 50 },
];

const BASE_PRICE = 150;

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

const run = async () => {
  await connectDB();

  const today = startOfToday();

  const movies = await Movie.find();

  const theaters = await Theater.find();

  if (theaters.length === 0) {
    console.error("No theaters found — add theaters before running this script.");
    process.exit(1);
  }

  console.log(`Checking ${movies.length} movies against ${theaters.length} theaters...`);

  let moviesUpdated = 0;
  let showtimesCreated = 0;

  for (const movie of movies) {
    // Does this movie already have a showtime today or later?
    const hasUpcoming = await Showtime.exists({
      movie: movie._id,
      showDate: { $gte: today },
    });

    if (hasUpcoming) {
      continue;
    }

    const newShowtimes: any[] = [];

    for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
      const showDate = addDays(today, dayOffset);

      // Give each movie 1-2 theaters (rotates through the list so
      // different movies don't all end up at the same one)
      const theaterCount = Math.min(2, theaters.length);

      for (let t = 0; t < theaterCount; t++) {
        const theater = theaters[(moviesUpdated + t) % theaters.length];

        if (!theater) {
          continue;
        }

        const screens = theater.screens?.length ? theater.screens : [{ name: "Screen 1", totalSeats: 144 }];

        TIME_SLOTS.forEach((slot, slotIndex) => {
          const screen = screens[slotIndex % screens.length] ?? { name: "Screen 1", totalSeats: 144 };

          const [hours = 0, minutes = 0] = slot.time.split(":").map(Number);

          const startTime = new Date(showDate);
          startTime.setHours(hours, minutes, 0, 0);

          const endTime = new Date(startTime);
          endTime.setHours(startTime.getHours() + 3);

          const totalSeats = screen.totalSeats || 144;

          newShowtimes.push({
            movie: movie._id,
            theater: theater._id,
            screen: screen.name,
            showDate,
            startTime: slot.time,
            endTime: `${endTime.getHours().toString().padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`,
            price: BASE_PRICE + slot.priceAdd,
            totalSeats,
            availableSeats: totalSeats,
            bookingSeats: [],
          });
        });
      }
    }

    await Showtime.insertMany(newShowtimes);

    showtimesCreated += newShowtimes.length;
    moviesUpdated++;

    console.log(`✓ ${movie.title} — added ${newShowtimes.length} showtimes`);
  }

  console.log(`\nDone. Movies updated: ${moviesUpdated}, showtimes created: ${showtimesCreated}`);

  process.exit(0);
};

run();
