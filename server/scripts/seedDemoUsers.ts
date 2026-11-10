// Save as server/scripts/seedDemoUsers.ts
//
// Creates (or repairs) two demo accounts for reviewers:
//   demo@moviebook.com   / Demo@1234   -> normal user
//   admin@moviebook.com  / Admin@1234  -> role "admin" (can add/delete theaters)
//
// Run from the server folder:   npx tsx scripts/seedDemoUsers.ts
//
// Safe to run more than once. It uses the MONGODB_URI in .env, so if your
// local .env points at the same Atlas database as your deployed site, the
// accounts exist on the live site too.

import "dotenv/config";
import bcrypt from "bcryptjs";
import connectDB from "../src/config/db";
import User from "../src/models/User";

const DEMO_USERS: {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}[] = [
    { name: "Demo User", email: "demo@moviebook.com", password: "Demo@1234", role: "user" },
    { name: "Demo Admin", email: "admin@moviebook.com", password: "Admin@1234", role: "admin" },
  ];

const run = async () => {
  await connectDB();

  for (const demo of DEMO_USERS) {
    try {
      let user: any = await User.findOne({ email: demo.email }).select("+password");

      if (!user) {
        user = await User.create({
          name: demo.name,
          email: demo.email,
          password: demo.password,
          role: demo.role,
        });

        user = await User.findById(user._id).select("+password");
      }

      // Make sure the stored password is a valid hash of the demo password.
      // (If your User model already hashes on save, this changes nothing.)
      const passwordOk = user.password
        ? await bcrypt.compare(demo.password, user.password)
        : false;

      const update: Record<string, unknown> = { role: demo.role };

      if (!passwordOk) {
        update.password = await bcrypt.hash(demo.password, 10);
      }

      await User.updateOne({ _id: user._id }, { $set: update });

      const check: any = await User.findById(user._id).select("+password");

      const loginWorks = await bcrypt.compare(demo.password, check.password);

      console.log(
        `${loginWorks ? "✓" : "✗"} ${demo.email}  (role: ${check.role})` +
        `${check.role === demo.role ? "" : "  <-- role was NOT saved"}`
      );
    } catch (error: any) {
      console.error(`✗ ${demo.email}: ${error.message}`);
    }
  }

  process.exit(0);
};

run();
