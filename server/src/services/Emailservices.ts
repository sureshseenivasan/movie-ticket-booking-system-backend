// Thin wrapper around services/notificationService.ts, so there is still
// only one place that actually talks to Resend for email. Several common
// export names are provided as aliases -- keep whichever ones your
// paymentController.ts / notificationJob.ts actually import, and delete
// the rest if you want to tidy this up later.

import { sendBookingEmail, TicketInfo } from "./notificationService";

// Generic name
export const sendEmail = async (
  to: string,
  ticket: TicketInfo
): Promise<void> => {
  await sendBookingEmail(to, ticket);
};

// Payment-flow specific name
export const sendPaymentEmail = async (
  to: string,
  ticket: TicketInfo
): Promise<void> => {
  await sendBookingEmail(to, ticket);
};

// Booking-flow specific name
export const sendBookingConfirmationEmail = async (
  to: string,
  ticket: TicketInfo
): Promise<void> => {
  await sendBookingEmail(to, ticket);
};

// Re-exported so callers can still import the type from here too
export type { TicketInfo };
