// Checks whether your Razorpay keys work, without the website involved.
// Save as server/scripts/testRazorpay.ts, then run from the server folder:
//
//   npx tsx scripts/testRazorpay.ts
//
// It never prints your secret, only its length.

import "dotenv/config";
import Razorpay from "razorpay";

const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

console.log("Key ID starts with :", keyId ? keyId.slice(0, 9) : "(missing)");
console.log("Key ID length      :", keyId.length);
console.log("Secret length      :", keySecret.length);

if (!keyId || !keySecret) {
  console.error("\n✗ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.");
  console.error("  They must be in server/.env, spelled exactly like that.");
  process.exit(1);
}

if (!keyId.startsWith("rzp_test_") && !keyId.startsWith("rzp_live_")) {
  console.error("\n✗ The Key ID should start with rzp_test_ (test mode).");
  console.error("  Check you copied the Key ID, not the secret, and not a placeholder.");
  process.exit(1);
}

const run = async () => {
  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: 10000, // Rs. 100, in paise
      currency: "INR",
      receipt: `test_${Date.now()}`,
    });

    console.log("\n✓ Your keys work. Test order created:", order.id);
  } catch (error: any) {
    console.error("\n✗ Razorpay rejected the request.");
    console.error("  Status :", error?.statusCode);
    console.error("  Reason :", error?.error?.description || error?.message || error);
  }

  process.exit(0);
};

run();
