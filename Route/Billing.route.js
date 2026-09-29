import express from "express";

import {
  getBillingRecords,
  updateBillingRecord,
  createBillingRecord,
  getBillingSummary,
} from "../Controller/Billing.controller.js";

const router = express.Router();


// GET monthly billing records
// Example:
// /api/billing?month=September&year=2026

router.get(
  "/",
  getBillingRecords
);


// CREATE billing record

router.post(
  "/",
  createBillingRecord
);


// UPDATE amount/status

router.put(
  "/:id",
  updateBillingRecord
);


// MONTHLY SUMMARY
// Example:
// /api/billing/summary?month=September&year=2026

router.get(
  "/summary",
  getBillingSummary
);


export default router;