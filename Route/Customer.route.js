import express from "express";

import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../Controller/Customer.Controller.js";

const router = express.Router();

// ======================================================
// CREATE CUSTOMER
// ======================================================
router.post("/", createCustomer);

// ======================================================
// GET ALL CUSTOMERS + SEARCH
// ======================================================
router.get("/", getCustomers);

// ======================================================
// GET SINGLE CUSTOMER
// ======================================================
router.get("/:id", getCustomerById);

// ======================================================
// UPDATE CUSTOMER
// ======================================================
router.put("/:id", updateCustomer);

// ======================================================
// DELETE CUSTOMER
// ======================================================
router.delete("/:id", deleteCustomer);

export default router;