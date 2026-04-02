import ActivityLog from "../model/activitylog-model.js";

export const cleanupOldActivityLogs = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
    });

    console.log(
      `[Cleanup] Deleted ${result.deletedCount} activity logs older than 7 days.`
    );

    return result.deletedCount;
  } catch (error) {
    console.error("[Cleanup] Failed to delete old activity logs:", error);
    throw error;
  }
};