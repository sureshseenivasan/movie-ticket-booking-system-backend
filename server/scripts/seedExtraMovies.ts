// Adds more movies to the database. Safe to run more than once — it
// upserts on "externalId", so it won't create duplicates.
//
// Run with: npx ts-node scripts/seedExtraMovies.ts
// Then run scripts/fetchPosters.ts to give these movies real posters.
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import "dotenv/config";
import mongoose from "mongoose";
import Movie from "../src/models/Movie";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/movieticket";

// Edit this list freely: add, remove, or change any movie.
// "poster" can be left as "" — the fetchPosters script will fill it in.
const movies = [
  {
    externalId: "extra-1",
    title: "Vikram",
    description: "A special agent investigates a series of murders linked to a drug cartel.",
    genre: ["Action", "Thriller"],
    language: "Tamil",
    releaseDate: new Date("2022-06-03"),
    duration: 173,
    poster: "",
    rating: 8.4,
  },
  {
    externalId: "extra-2",
    title: "Leo",
    description: "A café owner's mysterious past comes back to haunt him and his family.",
    genre: ["Action", "Drama"],
    language: "Tamil",
    releaseDate: new Date("2023-10-19"),
    duration: 164,
    poster: "",
    rating: 7.4,
  },
  {
    externalId: "extra-3",
    title: "Jailer",
    description: "A retired jailer goes on a manhunt to save his son from a dangerous gang.",
    genre: ["Action", "Comedy"],
    language: "Tamil",
    releaseDate: new Date("2023-08-10"),
    duration: 168,
    poster: "",
    rating: 7.2,
  },
  {
    externalId: "extra-4",
    title: "Pathaan",
    description: "An exiled spy must return to save his country from a dangerous mercenary.",
    genre: ["Action", "Thriller"],
    language: "Hindi",
    releaseDate: new Date("2023-01-25"),
    duration: 146,
    poster: "",
    rating: 7.0,
  },
  {
    externalId: "extra-5",
    title: "Jawan",
    description: "A man is driven by a personal vendetta to right the wrongs in society.",
    genre: ["Action", "Drama"],
    language: "Hindi",
    releaseDate: new Date("2023-09-07"),
    duration: 169,
    poster: "",
    rating: 7.1,
  },
  {
    externalId: "extra-6",
    title: "Animal",
    description: "A son's love for his father takes a violent, dangerous turn.",
    genre: ["Action", "Crime", "Drama"],
    language: "Hindi",
    releaseDate: new Date("2023-12-01"),
    duration: 201,
    poster: "",
    rating: 6.6,
  },
];

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  console.log(`Adding/updating ${movies.length} movies...`);

  for (const movie of movies) {
    await Movie.updateOne(
      { externalId: movie.externalId },
      { $set: movie },
      { upsert: true }
    );

    console.log(`✓ ${movie.title}`);
  }

  console.log("\nDone. Now run scripts/fetchPosters.ts to add real posters.");

  await mongoose.disconnect();
};

run();
