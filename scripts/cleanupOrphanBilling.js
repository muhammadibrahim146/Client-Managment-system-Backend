import dotenv from "dotenv";
import connectDB from "../Config/db.js";
import Customer from "../model/Customer.model.js";
import BillingRecord from "../model/BillingRecord.model.js";

dotenv.config();

const cleanupOrphanBilling = async () => {
  try {
    console.log("=================================");
    console.log("Orphan Billing Cleanup Started");
    console.log("=================================");

    await connectDB();

    console.log("Database connected.");

    // Get all existing customer IDs
    const customers = await Customer.find({})
      .select("_id")
      .lean();

    const customerIds = customers.map(
      (customer) => customer._id
    );

    // Find billing records whose customer no longer exists
    const orphanRecords = await BillingRecord.find({
      customerId: {
        $nin: customerIds,
      },
    })
      .select("_id customerId month year amount status")
      .lean();

    console.log(
      `Orphan billing records found: ${orphanRecords.length}`
    );

    if (orphanRecords.length === 0) {
      console.log("No orphan billing records found.");
      process.exit(0);
    }

    const orphanIds = orphanRecords.map(
      (record) => record._id
    );

    const result = await BillingRecord.deleteMany({
      _id: {
        $in: orphanIds,
      },
    });

    console.log(
      `Deleted orphan billing records: ${result.deletedCount}`
    );

    console.log("=================================");
    console.log("Cleanup Completed Successfully");
    console.log("=================================");

    process.exit(0);
  } catch (error) {
    console.error("Cleanup Failed:", error);
    process.exit(1);
  }
};

cleanupOrphanBilling();