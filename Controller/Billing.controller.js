import BillingRecord from "../model/BillingRecord.model.js";
import Customer from "../model/Customer.model.js";


// ======================================================
// GET MONTHLY BILLING RECORDS
// ======================================================

const getBillingRecords = async (req, res) => {
  try {
    const {
      month,
      year,
      search,
      status,
    } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const numericYear = Number(year);

    // --------------------------------------------------
    // Get all customers
    // --------------------------------------------------

    const customerFilter = {};

    if (search) {
      customerFilter.name = {
        $regex: search,
        $options: "i",
      };
    }

    const customers = await Customer.find(
      customerFilter
    ).sort({
      createdAt: -1,
    });

    // --------------------------------------------------
    // Create missing billing records automatically
    // --------------------------------------------------

    for (const customer of customers) {
      const existingRecord =
        await BillingRecord.findOne({
          customerId: customer._id,
          month,
          year: numericYear,
        });

      if (!existingRecord) {
        await BillingRecord.create({
          customerId: customer._id,
          month,
          year: numericYear,
          amount: 0,
          status: "Unpaid",
        });
      }
    }

    // --------------------------------------------------
    // Get billing records
    // --------------------------------------------------

    const billingFilter = {
      month,
      year: numericYear,
    };

    if (status) {
      billingFilter.status = status;
    }

    const billingRecords =
      await BillingRecord.find(billingFilter)
        .populate(
          "customerId",
          "name phone email address"
        )
        .sort({
          createdAt: -1,
        });

    // --------------------------------------------------
    // Search again after populate
    // --------------------------------------------------

    let filteredRecords = billingRecords;

    if (search) {
      const searchText = search.toLowerCase();

      filteredRecords = billingRecords.filter(
        (record) =>
          record.customerId &&
          (
            record.customerId.name
              ?.toLowerCase()
              .includes(searchText) ||
            record.customerId.phone
              ?.toLowerCase()
              .includes(searchText)
          )
      );
    }

    res.status(200).json({
      success: true,
      count: filteredRecords.length,
      billingRecords: filteredRecords,
    });

  } catch (error) {
    console.error(
      "Get Billing Records Error:",
      error
    );

    res.status(500).json({
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

    // Amount update
    if (amount !== undefined) {
      const numericAmount = Number(amount);

      if (
        Number.isNaN(numericAmount) ||
        numericAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount",
        });
      }

      updateData.amount = numericAmount;
    }

    // Status update
    if (status !== undefined) {
      if (
        !["Paid", "Unpaid"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be Paid or Unpaid",
        });
      }

      updateData.status = status;
    }

    const billingRecord =
      await BillingRecord.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "customerId",
        "name phone email address"
      );

    if (!billingRecord) {
      return res.status(404).json({
        success: false,
        message: "Billing record not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Billing record updated successfully",
      billingRecord,
    });

  } catch (error) {
    console.error(
      "Update Billing Record Error:",
      error
    );

    res.status(500).json({
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

    if (
      !customerId ||
      !month ||
      !year
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer, month and year are required",
      });
    }

    // Check customer
    const customer =
      await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check duplicate
    const existingRecord =
      await BillingRecord.findOne({
        customerId,
        month,
        year,
      });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message:
          "Billing record already exists for this month",
        billingRecord: existingRecord,
      });
    }

    const billingRecord =
      await BillingRecord.create({
        customerId,
        month,
        year,
        amount: amount || 0,
        status: status || "Unpaid",
      });

    const populatedRecord =
      await billingRecord.populate(
        "customerId",
        "name phone email address"
      );

    res.status(201).json({
      success: true,
      message:
        "Billing record created successfully",
      billingRecord: populatedRecord,
    });

  } catch (error) {
    console.error(
      "Create Billing Record Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create billing record",
      error: error.message,
    });
  }
};


// ======================================================
// MONTHLY SUMMARY
// ======================================================

const getBillingSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message:
          "Month and year are required",
      });
    }

    const numericYear = Number(year);

    const result =
      await BillingRecord.aggregate([
        {
          $match: {
            month,
            year: numericYear,
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
                  {
                    $eq: [
                      "$status",
                      "Paid",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            unpaidAmount: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Unpaid",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            paidCustomers: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Paid",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            unpaidCustomers: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Unpaid",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

    const summary =
      result[0] || {
        totalCustomers: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        paidCustomers: 0,
        unpaidCustomers: 0,
      };

    res.status(200).json({
      success: true,
      summary,
    });

  } catch (error) {
    console.error(
      "Billing Summary Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to calculate billing summary",
      error: error.message,
    });
  }
};


export {
  getBillingRecords,
  updateBillingRecord,
  createBillingRecord,
  getBillingSummary,
};