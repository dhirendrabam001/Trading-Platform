const mongoose = require("mongoose");

/**
 * One identity-verification step the user has submitted.
 *
 * The KYC page shows several steps (email, phone, ID document, address,
 * selfie). Each one is its own row here, so a user can be verified for some
 * and still pending on others — which is exactly what the page displays.
 *
 * The overall level lives on the User document as `kycStatus`, which already
 * existed before this feature.
 */
const kycSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Matches the step ids the KYC page already uses
    step: {
      type: String,
      required: true,
      enum: ["email", "phone", "identity", "address", "selfie"],
    },

    // Which verification tier this step unlocks
    level: { type: Number, required: true, min: 1, max: 3, default: 1 },

    status: {
      type: String,
      enum: ["Pending", "In Review", "Verified", "Action Needed"],
      default: "Pending",
    },

    // Short line shown under the step, e.g. the masked email or document type
    detail: { type: String, trim: true, maxlength: 160, default: "" },

    // Cloudinary URLs. Uploaded through the same multer + cloudinary path
    // the profile picture already uses.
    documents: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, default: "" },
          label: { type: String, default: "" },
        },
      ],
      default: [],
    },

    // Only set when an admin rejects it, so the user knows what to fix
    rejectionReason: { type: String, trim: true, maxlength: 300, default: "" },

    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// A user has at most one submission per step — resubmitting updates it
kycSubmissionSchema.index({ user: 1, step: 1 }, { unique: true });

const KycSubmission = mongoose.model("KycSubmission", kycSubmissionSchema);

module.exports = { KycSubmission };
