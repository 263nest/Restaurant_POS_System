const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");
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

// Get all orders and transactions for cashier dashboard (Admin & Cashier only)
const getCashierDashboard = async (req, res, next) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all orders for today
    const orders = await Order.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate("table")
      .sort({ createdAt: -1 });

    // Get all payments for today
    const payments = await Payment.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ createdAt: -1 });

    // Calculate order statistics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (order) => order.orderStatus === "completed",
    ).length;
    const inProgressOrders = orders.filter(
      (order) => order.orderStatus === "in progress",
    ).length;
    const pendingOrders = orders.filter(
      (order) => order.orderStatus === "pending",
    ).length;

    // Calculate total sales from orders
    const totalOrderSales = orders.reduce((sum, order) => {
      return sum + (order.bills?.totalWithTax || 0);
    }, 0);

    // Calculate total payments received
    const totalPayments = payments.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);

    // Calculate payment method breakdown
    const paymentMethods = {};
    payments.forEach((payment) => {
      const method = payment.method || "cash";
      paymentMethods[method] =
        (paymentMethods[method] || 0) + (payment.amount || 0);
    });

    // Get successful vs failed payments
    const successfulPayments = payments.filter(
      (p) => p.status === "completed" || p.status === "success",
    ).length;
    const failedPayments = payments.filter((p) => p.status === "failed").length;

    res.status(200).json({
      success: true,
      message: "Cashier dashboard data retrieved successfully",
      date: today.toLocaleDateString(),
      summary: {
        orders: {
          total: totalOrders,
          completed: completedOrders,
          inProgress: inProgressOrders,
          pending: pendingOrders,
        },
        sales: {
          totalOrderSales: totalOrderSales.toFixed(2),
          totalPayments: totalPayments.toFixed(2),
          totalRevenue: (totalOrderSales + totalPayments).toFixed(2),
        },
        payments: {
          total: payments.length,
          successful: successfulPayments,
          failed: failedPayments,
          methods: paymentMethods,
        },
      },
      data: {
        orders,
        payments,
      },
      retrievedBy: req.user.role,
      retrievedAt: new Date(),
    });
  } catch (error) {
    console.error("❌ Error fetching cashier dashboard:", error);
    next(error);
  }
};

module.exports = {
  addOrder,
  getOrderById,
  getOrders,
  updateOrder,
  getWaiterMetrics,
  getCashierDashboard,
};
