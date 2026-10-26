
import BillingRecord from "../model/BillingRecord.model.js";
import Customer from "../model/Customer.model.js";

// ======================================================
// ENSURE MONTHLY BILLING RECORDS
// ======================================================

const ensureMonthlyBillingRecords = async (month, year) => {
  // Get all customer IDs
  const customers = await Customer.find({})
    .select("_id")
    .lean();

  if (!customers.length) {
    return;
  }

  // Create missing monthly billing records
  const operations = customers.map((customer) => ({
    updateOne: {
      filter: {
        customerId: customer._id,
        month,
        year,
      },
      update: {
        $setOnInsert: {
          customerId: customer._id,
          month,
          year,
          amount: 0,
          status: "Unpaid",
        },
      },
      upsert: true,
    },
  }));

  await BillingRecord.bulkWrite(operations, {
    ordered: false,
  });
};

// ======================================================
// GET MONTHLY BILLING RECORDS
// Search: name, phone, email, address
// ======================================================

const getBillingRecords = async (req, res) => {
  try {
    const { month, year, search, status } = req.query;

    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const numericYear = Number(year);

    if (!Number.isInteger(numericYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    // STEP 1: Ensure monthly records exist
    await ensureMonthlyBillingRecords(month, numericYear);

    // STEP 2: Build billing filter
    const billingFilter = {
      month,
      year: numericYear,
    };

    if (status) {
      if (!["Paid", "Unpaid"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      billingFilter.status = status;
    }

    // STEP 3: Fetch selected month's billing records
    let billingRecords = await BillingRecord.find(billingFilter)
      .populate("customerId", "name phone email address")
      .sort({ createdAt: -1 })
      .lean();

    // STEP 4: Remove records whose customer no longer exists
    billingRecords = billingRecords.filter(
      (record) => record.customerId
    );

    // STEP 5: Search within selected month/year records
    if (search && search.trim()) {
      const searchText = search.trim().toLowerCase();

      billingRecords = billingRecords.filter((record) => {
        const customer = record.customerId;

        if (!customer) {
          return false;
        }

        const name = customer.name?.toLowerCase() || "";
        const phone = customer.phone?.toLowerCase() || "";
        const email = customer.email?.toLowerCase() || "";
        const address = customer.address?.toLowerCase() || "";

        return (
          name.includes(searchText) ||
          phone.includes(searchText) ||
          email.includes(searchText) ||
          address.includes(searchText)
        );
      });
    }

    // STEP 6: Return results
    return res.status(200).json({
      success: true,
      count: billingRecords.length,
      billingRecords,
    });
  } catch (error) {
    console.error("Get Billing Records Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get billing records",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE BILLING RECORD
// Amount + Paid/Unpaid
// ======================================================

const updateBillingRecord = async (req, res) => {
  try {
    const { amount, status } = req.body;
    const updateData = {};

    // Validate amount
    if (amount !== undefined) {
      const numericAmount = Number(amount);

      if (
        amount === null ||
        (typeof amount === "string" && amount.trim() === "") ||
        !Number.isFinite(numericAmount) ||
        numericAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount",
        });
      }

      updateData.amount = numericAmount;
    }

    // Validate status
    if (status !== undefined) {
      if (!["Paid", "Unpaid"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be Paid or Unpaid",
        });
      }

      updateData.status = status;
    }

    // Require at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide amount or status to update",
      });
    }

    const billingRecord = await BillingRecord.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    ).populate("customerId", "name phone email address");

    if (!billingRecord) {
      return res.status(404).json({
        success: false,
        message: "Billing record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Billing record updated successfully",
      billingRecord,
    });
  } catch (error) {
    console.error("Update Billing Record Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update billing record",
      error: error.message,
    });
  }
};

// ======================================================
// CREATE BILLING RECORD MANUALLY
// ======================================================

const createBillingRecord = async (req, res) => {
  try {
    const {
      customerId,
      month,
      year,
      amount,
      status,
    } = req.body;

    if (!customerId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Customer, month and year are required",
      });
    }

    // Check customer exists
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Validate year
    const numericYear = Number(year);

    if (!Number.isInteger(numericYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    // Check duplicate
    const existingRecord = await BillingRecord.findOne({
      customerId,
      month,
      year: numericYear,
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: "Billing record already exists for this month",
        billingRecord: existingRecord,
      });
    }

    // Validate amount
    const numericAmount = amount !== undefined ? Number(amount) : 0;

    if (
      amount === null ||
      (typeof amount === "string" && amount.trim() === "") ||
      !Number.isFinite(numericAmount) ||
      numericAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Validate status
    const finalStatus = status || "Unpaid";

    if (!["Paid", "Unpaid"].includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Paid or Unpaid",
      });
    }

    const billingRecord = await BillingRecord.create({
      customerId,
      month,
      year: numericYear,
      amount: numericAmount,
      status: finalStatus,
    });

    const populatedRecord = await billingRecord.populate(
      "customerId",
      "name phone email address"
    );

    return res.status(201).json({
      success: true,
      message: "Billing record created successfully",
      billingRecord: populatedRecord,
    });
  } catch (error) {
    console.error("Create Billing Record Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create billing record",
      error: error.message,
    });
  }
};

// ======================================================
// MONTHLY SUMMARY
// Search does not affect this summary
// ======================================================

const getBillingSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const numericYear = Number(year);

    if (!Number.isInteger(numericYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    // Ensure selected month's billing records exist
    await ensureMonthlyBillingRecords(month, numericYear);

    // Calculate summary for the entire selected month
    const result = await BillingRecord.aggregate([
      {
        $match: {
          month,
          year: numericYear,
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $match: {
          "customer.0": {
            $exists: true,
          },
        },
      },
      {
        $group: {
          _id: null,

          totalCustomers: {
            $sum: 1,
          },

          totalAmount: {
            $sum: "$amount",
          },

          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Paid"] },
                "$amount",
                0,
              ],
            },
          },

          unpaidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Unpaid"] },
                "$amount",
                0,
              ],
            },
          },

          paidCustomers: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Paid"] },
                1,
                0,
              ],
            },
          },

          unpaidCustomers: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Unpaid"] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const summary = result[0] || {
      totalCustomers: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      paidCustomers: 0,
      unpaidCustomers: 0,
    };

    delete summary._id;

    return res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Billing Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate billing summary",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

export {
  getBillingRecords,
  updateBillingRecord,
  createBillingRecord,
  getBillingSummary,
};
