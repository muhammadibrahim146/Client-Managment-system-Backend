import dotenv from "dotenv";
import connectDB from "../Config/db.js";
import Customer from "../model/Customer.model.js";
import BillingRecord from "../model/BillingRecord.model.js";

dotenv.config();

const migrateSeptember = async () => {
  try {
    console.log("=================================");
    console.log("September Migration Started...");
    console.log("=================================");

    // Connect MongoDB
    await connectDB();

    console.log("Database connected.");

    // IMPORTANT:
    // Current Customer model doesn't contain month/amount/status,
    // so we access the old fields directly from MongoDB collection.
    const oldCustomers = await Customer.collection
      .find({
        month: "September",
      })
      .toArray();

    console.log(
      `Old September customer records found: ${oldCustomers.length}`
    );

    if (oldCustomers.length === 0) {
      console.log("No old September records found.");
      process.exit(0);
    }

    // Get existing September 2026 billing records
    const existingBillingRecords = await BillingRecord.find({
      month: "September",
      year: 2026,
    })
      .select("customerId amount status")
      .lean();

    const existingMap = new Map();

    existingBillingRecords.forEach((record) => {
      existingMap.set(record.customerId.toString(), record);
    });

    const operations = [];

    let inserted = 0;
    let corrected = 0;
    let skipped = 0;

    for (const customer of oldCustomers) {
      const customerId = customer._id.toString();

      const amount = Number(customer.amount || 0);

      const status =
        customer.status === "Paid"
          ? "Paid"
          : "Unpaid";

      const existing = existingMap.get(customerId);

      // -----------------------------------------
      // CASE 1: Billing record already exists
      // -----------------------------------------

      if (existing) {
        // Only correct records which are still
        // default 0 / Unpaid placeholders.
        if (
          Number(existing.amount) === 0 &&
          existing.status === "Unpaid"
        ) {
          operations.push({
            updateOne: {
              filter: {
                _id: existing._id,
              },
              update: {
                $set: {
                  amount,
                  status,
                },
              },
            },
          });

          corrected++;
        } else {
          // Existing record contains actual data.
          // Don't overwrite it.
          skipped++;
        }
      }

      // -----------------------------------------
      // CASE 2: Billing record doesn't exist
      // -----------------------------------------

      else {
        operations.push({
          insertOne: {
            document: {
              customerId: customer._id,
              month: "September",
              year: 2026,
              amount,
              status,
            },
          },
        });

        inserted++;
      }
    }

    // -----------------------------------------
    // Execute migration
    // -----------------------------------------

    if (operations.length > 0) {
      await BillingRecord.bulkWrite(
        operations,
        {
          ordered: false,
        }
      );
    }

    console.log("");
    console.log("=================================");
    console.log("Migration Completed Successfully");
    console.log("=================================");

    console.log(`Inserted: ${inserted}`);
    console.log(`Corrected: ${corrected}`);
    console.log(`Skipped: ${skipped}`);

    console.log("=================================");

    process.exit(0);

  } catch (error) {
    console.error("");
    console.error("=================================");
    console.error("MIGRATION FAILED");
    console.error("=================================");
    console.error(error);
    console.error("=================================");

    process.exit(1);
  }
};

migrateSeptember();