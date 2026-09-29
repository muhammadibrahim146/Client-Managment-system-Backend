import mongoose from "mongoose";

const billingRecordSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    month: {
      type: String,
      required: true,
      enum: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
    },

    year: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
  },
  {
    timestamps: true,
  }
);

// Same customer cannot have duplicate billing
// record for the same month and year.
billingRecordSchema.index(
  {
    customerId: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

const BillingRecord = mongoose.model(
  "BillingRecord",
  billingRecordSchema
);

export default BillingRecord;