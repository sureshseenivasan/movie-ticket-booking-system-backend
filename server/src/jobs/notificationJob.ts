import cron from "node-cron";

import Booking from "../models/Booking";
import Notification from "../models/Notification";



export const startNotificationJob = () => {

  /*
   * Runs every 5 minutes
   */
  cron.schedule("*/5 * * * *", async () => {

    try {
      console.log(
        "Checking upcoming bookings..."
      );

      const now = new Date();

      const tomorrow = new Date(
        now.getTime() +
        24 * 60 * 60 * 1000
      );

      const bookings =
        await Booking.find({
          status: "CONFIRMED"
        })
          .populate("user")
          .populate("showtime");

      for (const booking of bookings) {

        const showtime =
          booking.showtime as any;

        if (!showtime) {
          continue;
        }

        const showDate =
          new Date(showtime.startTime);

        /*
         * Check if show is approximately
         * 24 hours away.
         */
        const difference =
          showDate.getTime() -
          now.getTime();

        const hours =
          difference /
          (1000 * 60 * 60);

        if (hours >= 23 && hours <= 25) {

          const existing =
            await Notification.findOne({
              booking: booking._id,
              type: "BOOKING_REMINDER"
            });

          if (existing) {
            continue;
          }

          const user =
            booking.user as any;

          if (!user) {
            continue;
          }

          await Notification.create({
            user: user._id,

            type: "BOOKING_REMINDER",

            title:
              "Your movie is tomorrow 🎬",

            message:
              `Your booking for ${showtime.startTime} is tomorrow.`,

            booking: booking._id,

            showtime: showtime._id,

            sentEmail: false,

            sentSMS: false
          });

          console.log(
            `Reminder created for booking ${booking.bookingNumber}`
          );
        }
      }

    } catch (error) {

      console.error(
        "Notification job error:",
        error
      );

    }

  });

  console.log(
    "Notification job started"
  );
};
