import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import "dotenv/config";
import axios from "axios";
import mongoose from "mongoose";
import Movie from "../src/models/Movie";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI or MONGODB_URI is missing from .env");
  }

  await mongoose.connect(mongoUri);
};

const searchTmdbPoster = async (title: string): Promise<string | null> => {
  const response = await axios.get("https://api.themoviedb.org/3/search/movie", {
    params: {
      api_key: TMDB_API_KEY,
      query: title,
      include_adult: false,
    },
  });

  const results = response.data?.results as any[] | undefined;

  const bestMatch = results?.find((movie) => movie.poster_path) ?? null;

  if (!bestMatch) return null;

  return `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}`;
};

const run = async () => {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY is missing from .env. See the comment at the top of this file.");
    process.exit(1);
  }

  await connectDB();

  const movies = await Movie.find();

  console.log(`Fetching real posters for ${movies.length} movies...`);

  let updated = 0;
  let notFound = 0;

  for (const movie of movies) {
    try {
      const posterUrl = await searchTmdbPoster(movie.title);

      if (posterUrl) {
        const before = movie.poster;

        movie.poster = posterUrl;

        await movie.save();

        updated++;

        console.log(`✓ ${movie.title}`);
        console.log(`    before: ${before || "(empty)"}`);
        console.log(`    after:  ${posterUrl}`);
      } else {
        notFound++;

        console.log(`✗ No TMDB match for "${movie.title}" — set a poster manually`);
      }
    } catch (error) {
      console.error(`Error fetching poster for "${movie.title}":`, error);
    }

    
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log(`\nDone. Updated: ${updated}, not found on TMDB: ${notFound}`);

  process.exit(0);
};

run();
