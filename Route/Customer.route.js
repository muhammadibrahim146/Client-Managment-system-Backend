import express from "express";

import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerSummary,
} from "../Controller/Customer.Controller.js";

const router = express.Router();

// Create Customer
router.post("/", createCustomer);

// Get All Customers + Search + Filter
router.get("/", getCustomers);

// Get Customer Summary / Total Amount
router.get("/summary", getCustomerSummary);

// Get Single Customer
router.get("/:id", getCustomerById);

// Update Customer
router.put("/:id", updateCustomer);

// Delete Customer
router.delete("/:id", deleteCustomer);

export default router;