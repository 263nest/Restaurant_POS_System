const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const { default: mongoose } = require("mongoose");

const addOrder = async (req, res, next) => {
  try {
    const order = new Order({
      ...req.body,
      createdBy: req.user._id, // Capture the waiter's user ID from JWT token
    });
    await order.save();
    res
      .status(201)
      .json({ success: true, message: "Order created!", data: order });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findById(id);
    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("table");
    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true },
    );

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res
      .status(200)
      .json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    next(error);
  }
};

// Get waiter-specific metrics (orders count, customers served, total earnings)
const getWaiterMetrics = async (req, res, next) => {
  try {
    const waiterId = req.user._id;

    // Get all orders created by this waiter
    const waiterOrders = await Order.find({ createdBy: waiterId });

    // Calculate metrics
    const totalOrders = waiterOrders.length;

    // Get unique customers (by phone number)
    const uniqueCustomers = new Set(
      waiterOrders.map((order) => order.customerDetails.phone),
    ).size;

    // Calculate total earnings
    const totalEarnings = waiterOrders.reduce((sum, order) => {
      return sum + (order.bills?.totalWithTax || 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        customersServed: uniqueCustomers,
        totalEarnings: totalEarnings.toFixed(2),
        waiterName: req.user.name,
        waiterId: waiterId,
      },
    });
  } catch (error) {
    console.error("Error fetching waiter metrics:", error);
    next(error);
  }
};

module.exports = {
  addOrder,
  getOrderById,
  getOrders,
  updateOrder,
  getWaiterMetrics,
};
