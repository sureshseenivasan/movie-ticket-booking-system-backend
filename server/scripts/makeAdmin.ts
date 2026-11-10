// One-time script: promotes an existing user to admin by email.
// Run with: npx tsx scripts/makeAdmin.ts someone@example.com

import "dotenv/config";
import connectDB from "../src/config/db";
import User from "../src/models/User";

const run = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx scripts/makeAdmin.ts someone@example.com");
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { $set: { role: "admin" } },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email "${email}". Register this account on the site first.`);
    process.exit(1);
  }

  console.log(`✓ ${user.email} is now an admin.`);

  process.exit(0);
};

run();
