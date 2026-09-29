import Customer from "../model/Customer.model.js";

// ======================================================
// CREATE CUSTOMER
// ======================================================

const createCustomer = async (req, res) => {
  try {
    const {
      name,
      address,
      email,
      phone,
    } = req.body;

    const customer = await Customer.create({
      name,
      address,
      email,
      phone,
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


// ======================================================
// GET ALL CUSTOMERS + SEARCH
// ======================================================

const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    const filter = {};

    // Search customer by name
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
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


// ======================================================
// GET SINGLE CUSTOMER
// ======================================================

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      customer,
    });

  } catch (error) {
    console.error("Get Customer Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get customer",
      error: error.message,
    });
  }
};


// ======================================================
// UPDATE CUSTOMER
// ======================================================

const updateCustomer = async (req, res) => {
  try {
    const {
      name,
      address,
      email,
      phone,
    } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        address,
        email,
        phone,
      },
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


// ======================================================
// DELETE CUSTOMER
// ======================================================

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


// ======================================================
// EXPORTS
// ======================================================

export {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};