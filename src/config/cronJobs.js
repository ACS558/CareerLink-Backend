import cron from "node-cron";
import {
  updateAccountStatuses,
  softDeleteExpiredAccounts,
  permanentDeleteOldAccounts,
} from "../services/accountExpiryService.js";

export const initializeCronJobs = () => {
  console.log("⏰ Initializing cron jobs...");

  // Daily at 2 AM - Update statuses
  cron.schedule("0 2 * * *", async () => {
    console.log("🔄 Updating account statuses...");
    await updateAccountStatuses();
  });

  // Daily at 3 AM - Soft delete
  cron.schedule("0 3 * * *", async () => {
    console.log("🗑️ Soft deleting expired accounts...");
    await softDeleteExpiredAccounts();
  });

  // Daily at 4 AM - Permanent delete
  cron.schedule("0 4 * * *", async () => {
    console.log("🗑️ Permanently deleting old accounts...");
    await permanentDeleteOldAccounts();
  });

  console.log("✅ Cron jobs initialized");
};
