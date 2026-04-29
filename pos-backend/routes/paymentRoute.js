const express = require("express");
const router = express.Router();
const { isVerifiedUser, isAdminOrCashier } = require("../middlewares/tokenVerification");
const { createOrder, verifyPayment, webHookVerification, getDayTransactions } = require("../controllers/paymentController");
 
router.route("/create-order").post(isVerifiedUser , createOrder);
router.route("/verify-payment").post(isVerifiedUser , verifyPayment);
router.route("/webhook-verification").post(webHookVerification);

// Route to view daily transactions (Admin & Cashier only)
router.route("/day-transactions").get(isVerifiedUser, isAdminOrCashier, getDayTransactions);

module.exports = router;