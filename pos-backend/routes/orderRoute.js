const express = require("express");
const {
  addOrder,
  getOrders,
  getOrderById,
  updateOrder,
  getWaiterMetrics,
} = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

router.route("/").post(isVerifiedUser, addOrder);
router.route("/").get(isVerifiedUser, getOrders);
router.route("/metrics/waiter").get(isVerifiedUser, getWaiterMetrics);
router.route("/:id").get(isVerifiedUser, getOrderById);
router.route("/:id").put(isVerifiedUser, updateOrder);

module.exports = router;
