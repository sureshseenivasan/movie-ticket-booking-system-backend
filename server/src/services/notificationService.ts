import axios from "axios";
import twilio from "twilio";

export type TicketInfo = {
  bookingNumber: string;
  movieTitle: string;
  theaterName: string;
  screen?: string | undefined;
  showTime?: string | undefined;
  seats: string[];
  totalAmount: number;
};

// =============================================
// HELPERS
// =============================================

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const IST = "Asia/Kolkata";

const formatShowDate = (value: unknown): string => {
  if (!value) return "";

  const date = new Date(value as any);

  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: IST,
  });
};

// "18:30" -> "6:30 PM". Text that is already formatted is left as it is.
const formatClock = (value: unknown): string => {
  if (!value) return "";

  const text = String(value).trim();

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(text);

  if (match) {
    const hours = Number(match[1]);

    return `${hours % 12 || 12}:${match[2]} ${hours >= 12 ? "PM" : "AM"}`;
  }

  // Full date-time string, e.g. 2026-09-21T13:00:00Z
  const date = new Date(text);

  if (text.includes("T") && !isNaN(date.getTime())) {
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: IST,
    });
  }

  return text;
};

// Builds e.g. "21 Sep 2026, 6:30 PM - 9:00 PM" from a showtime document
export const formatShowSlot = (showtime: any): string => {
  if (!showtime) return "";

  const date = formatShowDate(showtime.showDate ?? showtime.date);

  const start = formatClock(showtime.startTime ?? showtime.time);

  const end = formatClock(showtime.endTime);

  const time = start && end ? `${start} - ${end}` : start;

  return [date, time].filter(Boolean).join(", ");
};

// "Address, Location" from a populated theater (duplicates removed)
export const formatTheaterLocation = (theater: any): string => {
  if (!theater || typeof theater !== "object") return "";

  const parts: string[] = [];

  [theater.address, theater.location, theater.city].forEach((value) => {
    const text = typeof value === "string" ? value.trim() : "";

    if (
      text &&
      !parts.some((part) => part.toLowerCase().includes(text.toLowerCase()))
    ) {
      parts.push(text);
    }
  });

  return parts.join(", ");
};

// Accepts "9876543210", "+919876543210", "98765 43210" ...
// A 10-digit number is treated as an Indian number (+91).
export const normalizePhone = (input: string): string | null => {
  const cleaned = input.replace(/[\s\-()]/g, "");

  if (/^\+\d{10,15}$/.test(cleaned)) return cleaned;

  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;

  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;

  return null;
};

const ticketLines = (t: TicketInfo): string[] => [
  `Booking ID: ${t.bookingNumber}`,
  `Movie: ${t.movieTitle}`,
  `Theater: ${t.theaterName}`,
  ...(t.screen ? [`Screen: ${t.screen}`] : []),
  ...(t.showTime ? [`Show time: ${t.showTime}`] : []),
  `Seats: ${t.seats.join(", ")}`,
  `Total paid: Rs. ${t.totalAmount}`,
];

// =============================================
// EMAIL (Nodemailer / SMTP)
// =============================================

export const sendBookingEmail = async (
  to: string,
  ticket: TicketInfo
): Promise<void> => {
  const { RESEND_API_KEY, EMAIL_FROM } = process.env;

  if (!RESEND_API_KEY) {
    throw new Error("Email is not configured on the server (check RESEND_API_KEY in .env)");
  }

  const rowsHtml = ticketLines(ticket)
    .map((line) => {
      const [label = "", ...rest] = line.split(": ");

      return `<tr>
        <td style="padding:8px 12px;color:#64748b">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;font-weight:bold;text-align:right">${escapeHtml(rest.join(": "))}</td>
      </tr>`;
    })
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <div style="background:#0f172a;color:#fff;padding:20px">
        <h1 style="margin:0;font-size:22px">MovieBook</h1>
        <p style="margin:6px 0 0;font-size:14px">Your booking is confirmed!</p>
      </div>
      <table style="width:100%;border-collapse:collapse">${rowsHtml}</table>
      <p style="padding:12px 20px;color:#64748b;font-size:13px">
        Show this email at the theater entrance. Enjoy the movie!
      </p>
    </div>`;

  const text = [
    "MovieBook - Your booking is confirmed!",
    "",
    ...ticketLines(ticket),
    "",
    "Show this email at the theater entrance. Enjoy the movie!",
  ].join("\n");

  try {
    await axios.post(
      "https://api.resend.com/emails",
      {
        from: EMAIL_FROM || "MovieBook <onboarding@resend.dev>",
        to,
        subject: `Booking confirmed - ${ticket.movieTitle} (${ticket.bookingNumber})`,
        text,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    // Resend returns a clear JSON error message -- surface it instead of
    // a generic axios error
    const resendMessage = error.response?.data?.message;

    throw new Error(resendMessage || "Could not send email via Resend");
  }
};

// =============================================
// SMS (Twilio)
// To use another provider (Fast2SMS, MSG91 ...), replace the body of this
// function. The rest of the app does not need to change.
// =============================================

export const sendBookingSms = async (
  to: string,
  ticket: TicketInfo
): Promise<void> => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } =
    process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error("SMS is not configured on the server (check TWILIO_* in .env)");
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  const when = ticket.showTime ? `, ${ticket.showTime}` : "";

  const body =
    `MovieBook: Booking confirmed! ID ${ticket.bookingNumber}. ` +
    `${ticket.movieTitle}, ${ticket.theaterName}${when}. ` +
    `Seats: ${ticket.seats.join(", ")}. Paid Rs.${ticket.totalAmount}.`;

  await client.messages.create({
    body,
    from: TWILIO_PHONE_NUMBER,
    to,
  });
};
