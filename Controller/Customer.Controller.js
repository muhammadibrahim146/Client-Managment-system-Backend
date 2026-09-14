import Customer from "../model/Customer.model.js"

// CREATE CUSTOMER
const createCustomer = async (req, res) => {
  try {
    const {
      name,
      address,
      email,
      phone,
      month,
      amount,
      status,
    } = req.body;

    const customer = await Customer.create({
      name,
      address,
      email,
      phone,
      month,
      amount,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Customer added successfully",
      customer,
    });
  } catch (error) {
    console.error("Create Customer Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add customer",
      error: error.message,
    });
  }
};


// GET ALL CUSTOMERS + SEARCH + FILTER
const getCustomers = async (req, res) => {
  try {
    const { search, month, status } = req.query;

    const filter = {};

    // Search by name
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    // Month filter
    if (month) {
      filter.month = month;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });

  } catch (error) {
    console.error("Get Customers Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get customers",
      error: error.message,
    });
  }
};


// GET SINGLE CUSTOMER
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get customer",
      error: error.message,
    });
  }
};


// UPDATE CUSTOMER
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Update Customer Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error.message,
    });
  }
};


// DELETE CUSTOMER
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete Customer Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: error.message,
    });
  }
};

// GET CUSTOMER SUMMARY
const getCustomerSummary = async (req, res) => {
  try {
    const { month, status } = req.query;

    const match = {};

    // Month filter
    if (month) {
      match.month = month;
    }

    // Status filter
    if (status) {
      match.status = status;
    }

    const result = await Customer.aggregate([
      {
        $match: match,
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

    res.status(200).json({
      success: true,
      summary,
    });

  } catch (error) {
    console.error("Summary Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to calculate summary",
      error: error.message,
    });
  }
};
export { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer, getCustomerSummary, };