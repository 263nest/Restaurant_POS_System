const express = require("express");
const {
  addOrder,
  getOrders,
  getOrderById,
  updateOrder,
  getWaiterMetrics,
  getCashierDashboard,
} = require("../controllers/orderController");
const {
  isVerifiedUser,
  isAdminOrCashier,
} = require("../middlewares/tokenVerification");
const router = express.Router();

router.route("/").post(isVerifiedUser, addOrder);
router.route("/").get(isVerifiedUser, getOrders);
router.route("/metrics/waiter").get(isVerifiedUser, getWaiterMetrics);
router.route("/:id").get(isVerifiedUser, getOrderById);
router.route("/:id").put(isVerifiedUser, updateOrder);

// Cashier dashboard - view all orders and transactions (Admin & Cashier only)
router
  .route("/dashboard/cashier")
  .get(isVerifiedUser, isAdminOrCashier, getCashierDashboard);

module.exports = router;
