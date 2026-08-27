const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { BankAccount } = require("../models/bankAccount.model");

function toApi(account) {
  return {
    id: String(account._id),
    bank: account.bank,
    holder: account.holder,
    // Rebuilt for display. We never stored the other digits.
    number: `•••• •••• ${account.last4}`,
    last4: account.last4,
    type: account.type,
    currency: account.currency,
    country: account.country,
    swift: account.swift,
    status: account.status,
    isDefault: account.isDefault,
    added: account.createdAt,
  };
}

/** GET /api/bank-accounts */
const list = asyncHandler(async (req, res) => {
  const accounts = await BankAccount.find({ user: req.user.id }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  res.json({ success: true, accounts: accounts.map(toApi) });
});

/** POST /api/bank-accounts */
const create = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { bank, holder, accountNumber, type, currency, country, swift } = req.body;

  // Only the last four digits are kept. The rest is thrown away here and
  // never written anywhere — see the note in the model.
  const last4 = String(accountNumber).replace(/\D/g, "").slice(-4);
  if (last4.length !== 4) {
    throw ApiError.badRequest("Account number must contain at least 4 digits");
  }

  const existing = await BankAccount.countDocuments({ user: userId });

  const account = await BankAccount.create({
    user: userId,
    bank,
    holder,
    last4,
    type,
    currency,
    country,
    swift,
    // The very first account a user adds becomes their default
    isDefault: existing === 0,
  });

  res.status(201).json({
    success: true,
    message: "Bank account added and awaiting verification",
    account: toApi(account),
  });
});

/**
 * PATCH /api/bank-accounts/:id/default
 *
 * Exactly one account can be the default. Clearing the others FIRST means
 * that if the second update fails, nothing is marked default — which the UI
 * handles fine. Doing it the other way round could leave two defaults, and
 * then "which account do we pay out to?" has no answer.
 */
const setDefault = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const account = await BankAccount.findOne({ _id: req.params.id, user: userId });
  if (!account) throw ApiError.notFound("Bank account not found");

  await BankAccount.updateMany(
    { user: userId },
    { $set: { isDefault: false } },
  );

  account.isDefault = true;
  await account.save();

  res.json({
    success: true,
    message: "Default account updated",
    account: toApi(account),
  });
});

/** DELETE /api/bank-accounts/:id */
const remove = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const account = await BankAccount.findOne({ _id: req.params.id, user: userId });
  if (!account) throw ApiError.notFound("Bank account not found");

  const wasDefault = account.isDefault;
  await BankAccount.deleteOne({ _id: account._id });

  // Removing the default would leave the user with none. Promote the next
  // one so there is always a payout account while any exist.
  if (wasDefault) {
    const next = await BankAccount.findOne({ user: userId }).sort({
      createdAt: -1,
    });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }

  res.json({ success: true, message: "Bank account removed" });
});

module.exports = { list, create, setDefault, remove };
