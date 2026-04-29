const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const config = Object.freeze({
  port: process.env.PORT || 3000,
  databaseURI: process.env.MONGODB_URI || "mongodb://localhost:27017/pos-db",
  nodeEnv: process.env.NODE_ENV || "development",
  accessTokenSecret: process.env.JWT_SECRET,
  // MPESA Configuration (replacing Razorpay)
  mpesaConsumerKey: process.env.MPESA_CONSUMER_KEY,
  mpesaConsumerSecret: process.env.MPESA_CONSUMER_SECRET,
  mpesaBusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
  mpesaPassKey: process.env.MPESA_PASS_KEY,
  mpesaCallbackUrl: process.env.MPESA_CALLBACK_URL,
  // Legacy Razorpay (disabled)
  // razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  // razorpaySecretKey: process.env.RAZORPAY_KEY_SECRET,
  // razorpyWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
});

module.exports = config;
