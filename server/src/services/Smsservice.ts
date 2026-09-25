// Thin wrapper around services/notificationService.ts, so there is still
// only one place that actually talks to Twilio for SMS. Several common
// export names are provided as aliases -- keep whichever ones your
// paymentController.ts / notificationJob.ts actually import, and delete
// the rest if you want to tidy this up later.

import { sendBookingSms, TicketInfo } from "./notificationService";

// Generic name
export const sendSms = async (
  to: string,
  ticket: TicketInfo
): Promise<void> => {
  await sendBookingSms(to, ticket);
};

// Payment-flow specific name
export const sendPaymentSms = async (
  to: string,
  ticket: TicketInfo
): Promise<void> => {
  await sendBookingSms(to, ticket);
};

// Booking-flow specific name
export const sendBookingConfirmationSms = async (
  to: string,
  ticket: TicketInfo
): Promise<void> => {
  await sendBookingSms(to, ticket);
};

// Re-exported so callers can still import the type from here too
export type { TicketInfo };
