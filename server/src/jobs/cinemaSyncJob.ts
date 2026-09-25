import cron from "node-cron";
import {
  syncCinemaDatabase
} from "../services/cinemaSyncService";
import Showtime from "../models/Showtime";
import Booking from "../models/Booking";
import Notification from "../models/Notification";

export const startCinemaSyncJob = () => {
  /*
   * Runs every 5 minutes
   */
  cron.schedule("*/5 * * * *", async () => {
    console.log(
      "Running scheduled cinema synchronization..."
    );

    try {
      await syncCinemaDatabase();
    } catch (error) {
      console.error(
        "Scheduled cinema synchronization failed:",
        error
      );
    }

    const existingShowtime =
      await Showtime.findOne({
        externalId: { $exists: true }
      });

    if (!existingShowtime) {
      console.log(
        "No existing showtime found for synchronization check."
      );
      return;
    }

    if (
      existingShowtime.startTime == null ||
      existingShowtime.endTime == null ||
      existingShowtime.screen == null
    ) {
      console.log(
        `Showtime data incomplete: ${existingShowtime.externalId}`
      );

      const affectedBookings = await Booking.find({
        showtime: existingShowtime._id,
        status: "CONFIRMED"
      }).populate("user");

      for (const booking of affectedBookings) {
        const user = booking.user as any;

        if (!user) {
          continue;
        }

        await Notification.create({
          user: user._id,
          type: "SHOWTIME_CHANGED",
          title: "Showtime Updated 🎬",
          message: `Your movie showtime has been changed to ${existingShowtime.startTime}.`,
          booking: booking._id,
          showtime: existingShowtime._id,
          sentEmail: false,
          sentSMS: false
        });
      }
    }
  });

  console.log(
    "Cinema synchronization job started"
  );
};
