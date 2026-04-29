// const Razorpay = require("razorpay"); // DISABLED - Using MPESA instead
const config = require("../config/config");
const crypto = require("crypto");
const axios = require("axios");
const Payment = require("../models/paymentModel");

// ========== MPESA INTEGRATION ==========

// Get MPESA Access Token
const getMpesaAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${config.mpesaConsumerKey}:${config.mpesaConsumerSecret}`,
    ).toString("base64");

    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );

    return response.data.access_token;
  } catch (error) {
    console.error("❌ Error getting MPESA access token:", error.message);
    throw error;
  }
};

// Generate MPESA Password
const generateMpesaPassword = () => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:-]/g, "")
    .split(".")[0];
  const shortCode = config.mpesaBusinessShortCode;
  const passKey = config.mpesaPassKey;

  const password = Buffer.from(`${shortCode}${passKey}${timestamp}`).toString(
    "base64",
  );
  return { password, timestamp };
};

const createOrder = async (req, res, next) => {
  try {
    const { amount, phoneNumber } = req.body;

    if (!amount || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Amount and phone number are required",
      });
    }

    // Validate phone number format (should be 254XXXXXXXXX for Kenya)
    const formattedPhoneNumber = phoneNumber.replace(/^0/, "254");
    if (!/^254\d{9}$/.test(formattedPhoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // Get MPESA access token
    const accessToken = await getMpesaAccessToken();

    // Generate password and timestamp
    const { password, timestamp } = generateMpesaPassword();

    // Prepare STK Push request
    const stkPushRequest = {
      BusinessShortCode: config.mpesaBusinessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhoneNumber,
      PartyB: config.mpesaBusinessShortCode,
      PhoneNumber: formattedPhoneNumber,
      CallBackURL: config.mpesaCallbackUrl,
      AccountReference: `Order_${Date.now()}`,
      TransactionDesc: "Restaurant POS Payment",
    };

    // Call MPESA STK Push API
    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      stkPushRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(
      `📱 MPESA STK Push Sent: ${amount} KES to ${formattedPhoneNumber}`,
    );
    console.log("STK Push Response:", response.data);

    res.status(200).json({
      success: true,
      message:
        "Payment prompt sent to customer - Please enter your M-Pesa PIN",
      paymentMethod: "MPESA",
      amount,
      phoneNumber: formattedPhoneNumber,
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      merchantRequestId: response.data.MerchantRequestID,
    });
  } catch (error) {
    console.log("❌ M-Pesa Error:", error.message);
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { checkoutRequestId, resultCode } = req.body;

    // TODO: Implement MPESA payment verification
    if (resultCode === 0) {
      console.log(`✅ MPESA Payment Verified: ${checkoutRequestId}`);
      res.json({
        success: true,
        message: "MPESA Payment verified successfully!",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "MPESA Payment verification failed",
        resultCode,
      });
    }
  } catch (error) {
    next(error);
  }
};

const webHookVerification = async (req, res, next) => {
  try {
    // TODO: Implement MPESA webhook verification
    console.log("🔔 MPESA Webhook received:", req.body);

    // Example: Process payment callback
    if (req.body.Body?.stkCallback?.ResultCode === 0) {
      const callbackMetadata = req.body.Body.stkCallback.CallbackMetadata;
      const amount = callbackMetadata?.Item?.find(
        (item) => item.Name === "Amount",
      )?.Value;
      const phoneNumber = callbackMetadata?.Item?.find(
        (item) => item.Name === "PhoneNumber",
      )?.Value;

      console.log(`💰 Payment Received via MPESA: ${amount} KES`);

      // TODO: Save to database
      // const newPayment = new Payment({...});
      // await newPayment.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    next(error);
  }
};

// Get all transactions for the current day (Admin & Cashier only)
const getDayTransactions = async (req, res, next) => {
  try {
    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all payments for today
    const transactions = await Payment.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ createdAt: -1 });

    // Calculate summary stats
    const totalAmount = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(t => t.status === "completed" || t.status === "success").length;
    const failedTransactions = transactions.filter(t => t.status === "failed").length;

    res.status(200).json({
      success: true,
      message: "Daily transactions retrieved successfully",
      date: today.toLocaleDateString(),
      summary: {
        totalTransactions,
        totalAmount,
        successfulTransactions,
        failedTransactions,
        pendingTransactions: totalTransactions - successfulTransactions - failedTransactions
      },
      transactions,
      retrievedBy: req.user.role,
      retrievedAt: new Date()
    });
  } catch (error) {
    console.error("❌ Error fetching day transactions:", error);
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, webHookVerification, getDayTransactions };
