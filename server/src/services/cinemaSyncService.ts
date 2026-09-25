import Movie from "../models/Movie";
import Theater from "../models/Theater";
import Showtime from "../models/Showtime";

interface CinemaMovie {
  externalId: string;
  title: string;
  description?: string;
  genre: string[];
  language: string;
  releaseDate?: string;
  duration?: number;
  poster?: string;
  backdrop?: string;
  rating?: number;
}

interface CinemaTheater {
  externalId: string;
  name: string;
  location: string;
  address?: string;
  screens?: number;
}

interface CinemaShowtime {
  externalId: string;
  movieExternalId: string;
  theaterExternalId: string;
  screen: string;
  startTime: string;
  endTime: string;
  showDate: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  bookingSeats: string[];
}

/*
  Replace these functions with calls to your actual
  cinema provider/API.
*/

const getCinemaMovies = async (): Promise<CinemaMovie[]> => {
  return [];
};

const getCinemaTheaters = async (): Promise<CinemaTheater[]> => {
  return [];
};

const getCinemaShowtimes = async (): Promise<CinemaShowtime[]> => {
  return [];
};

export const syncCinemaDatabase = async () => {
  console.log("Starting cinema database synchronization...");

  try {
    const movies = await getCinemaMovies();
    const theaters = await getCinemaTheaters();
    const showtimes = await getCinemaShowtimes();

    /*
     * MOVIES
     */
    for (const movie of movies) {
      await Movie.findOneAndUpdate(
        {
          externalId: movie.externalId
        },
        {
          ...movie
        },
        {
          upsert: true,
          new: true
        }
      );
    }

    /*
     * THEATERS
     */
    for (const theater of theaters) {
      await Theater.findOneAndUpdate(
        {
          externalId: theater.externalId
        },
        {
          ...theater
        },
        {
          upsert: true,
          new: true
        }
      );
    }

    /*
     * SHOWTIMES
     */
    for (const showtime of showtimes) {
      const movie = await Movie.findOne({
        externalId: showtime.movieExternalId
      });

      const theater = await Theater.findOne({
        externalId: showtime.theaterExternalId
      });

      if (!movie || !theater) {
        console.log(
          `Skipping showtime ${showtime.externalId}`
        );

        continue;
      }

      await Showtime.findOneAndUpdate(
        {
          externalId: showtime.externalId
        },
        {
          movie: movie._id,
          theater: theater._id,
          screen: showtime.screen,
          startTime: showtime.startTime,
          endTime: showtime.endTime,
          showDate: showtime.showDate,
          price: showtime.price,
          totalSeats: showtime.totalSeats,
          availableSeats: showtime.availableSeats,
          bookingSeats: showtime.bookingSeats
        },
        {
          upsert: true,
          new: true
        }
      );
    }

    console.log("Cinema database synchronization completed");

    return {
      movies: movies.length,
      theaters: theaters.length,
      showtimes: showtimes.length
    };
  } catch (error) {
    console.error(
      "Cinema synchronization failed:",
      error
    );

    throw error;
  }
};
