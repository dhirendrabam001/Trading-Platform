const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { KycSubmission } = require("../models/kycSubmission.model");
const { User } = require("../models/user.model");
const uploadToCloudinary = require("../utils/uploadCloudinary");

/**
 * The five steps, and which verification level each one unlocks.
 * The KYC page already uses these exact ids.
 */
const STEPS = [
  { id: "email", level: 1, title: "Email Address", needsDocument: false },
  { id: "phone", level: 1, title: "Phone Number", needsDocument: false },
  { id: "identity", level: 2, title: "Identity Document", needsDocument: true },
  { id: "address", level: 2, title: "Proof of Address", needsDocument: true },
  { id: "selfie", level: 3, title: "Selfie Verification", needsDocument: true },
];

const LEVELS = [
  { level: 1, name: "Basic", withdrawal: 2000, trading: 10000 },
  { level: 2, name: "Verified", withdrawal: 50000, trading: 250000 },
  { level: 3, name: "Pro", withdrawal: 500000, trading: null },
];

/**
 * A user's level is the highest one where EVERY step for it is verified.
 * Checked in order and stopped at the first gap — you cannot reach level 3
 * by skipping level 2.
 */
function levelFromSubmissions(submissions) {
  const byStep = new Map(submissions.map((s) => [s.step, s]));
  let reached = 0;

  for (const level of [1, 2, 3]) {
    const stepsForLevel = STEPS.filter((s) => s.level === level);
    const allDone = stepsForLevel.every(
      (s) => byStep.get(s.id)?.status === "Verified",
    );

    if (!allDone) break;
    reached = level;
  }

  return reached;
}

/** GET /api/kyc — the whole KYC page in one response */
const getStatus = asyncHandler(async (req, res) => {
  const submissions = await KycSubmission.find({ user: req.user.id }).lean();
  const byStep = new Map(submissions.map((s) => [s.step, s]));

  const currentLevel = levelFromSubmissions(submissions);

  const steps = STEPS.map((step) => {
    const submission = byStep.get(step.id);

    // A step is locked until everything below it is done. Showing an action
    // button on a locked step is misleading, so the flag is explicit.
    const locked = step.level > currentLevel + 1;

    return {
      id: step.id,
      title: step.title,
      level: step.level,
      needsDocument: step.needsDocument,
      status: submission ? submission.status : "Pending",
      detail: submission ? submission.detail : "",
      rejectionReason: submission ? submission.rejectionReason : "",
      documents: submission ? submission.documents.length : 0,
      submittedAt: submission ? submission.createdAt : null,
      locked,
    };
  });

  res.json({
    success: true,
    currentLevel,
    nextLevel: currentLevel < 3 ? LEVELS[currentLevel] : null,
    levels: LEVELS,
    steps,
    completed: steps.filter((s) => s.status === "Verified").length,
    totalSteps: STEPS.length,
    progress: Math.round(
      (steps.filter((s) => s.status === "Verified").length / STEPS.length) * 100,
    ),
  });
});

/**
 * POST /api/kyc/:step
 *
 * Submits or re-submits one step. Uses the same multer + cloudinary path the
 * profile picture already goes through.
 */
const submitStep = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { step } = req.params;

  const meta = STEPS.find((s) => s.id === step);
  if (!meta) throw ApiError.badRequest(`Unknown verification step "${step}"`);

  const existing = await KycSubmission.findOne({ user: userId, step });

  // Re-submitting something already approved would silently drop them back
  // to "In Review", which is not something a user would expect to happen.
  if (existing && existing.status === "Verified") {
    throw ApiError.badRequest("This step is already verified");
  }

  const documents = existing ? [...existing.documents] : [];

  if (meta.needsDocument) {
    if (!req.file && documents.length === 0) {
      throw ApiError.badRequest(`${meta.title} requires a document upload`);
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      documents.push({
        url: result.secure_url,
        publicId: result.public_id,
        label: req.body.label || meta.title,
      });
    }
  }

  const submission = await KycSubmission.findOneAndUpdate(
    { user: userId, step },
    {
      $set: {
        level: meta.level,
        status: "In Review",
        detail: req.body.detail || "",
        documents,
        rejectionReason: "",
        reviewedAt: null,
        reviewedBy: null,
      },
      $setOnInsert: { user: userId, step },
    },
    { new: true, upsert: true },
  );

  res.status(201).json({
    success: true,
    message: `${meta.title} submitted and is now in review`,
    step: {
      id: submission.step,
      status: submission.status,
      documents: submission.documents.length,
    },
  });
});

/**
 * PATCH /api/kyc/:userId/:step/review  (admin only)
 *
 * Approving or rejecting a step. Kept here so the whole KYC flow lives in one
 * file; the route is behind adminMiddleware.
 */
const reviewStep = asyncHandler(async (req, res) => {
  const { userId, step } = req.params;
  const { decision, reason } = req.body;

  const submission = await KycSubmission.findOne({ user: userId, step });
  if (!submission) throw ApiError.notFound("Submission not found");

  submission.status = decision === "approve" ? "Verified" : "Action Needed";
  submission.rejectionReason = decision === "approve" ? "" : reason || "";
  submission.reviewedAt = new Date();
  submission.reviewedBy = req.user.id;
  await submission.save();

  // Keep the summary field on the user in step with the detail rows
  const all = await KycSubmission.find({ user: userId }).lean();
  const level = levelFromSubmissions(all);

  // kycStatus on the User model is a BOOLEAN, not a string. Assigning
  // "pending" here would cast to true (any non-empty string is truthy), so
  // every user would read as verified. Level 2 is the tier that counts as
  // fully verified; the per-step detail lives in KycSubmission.
  await User.findByIdAndUpdate(userId, { kycStatus: level >= 2 });

  res.json({
    success: true,
    message: `Step ${decision === "approve" ? "approved" : "rejected"}`,
    level,
  });
});

module.exports = { getStatus, submitStep, reviewStep, STEPS, LEVELS };
