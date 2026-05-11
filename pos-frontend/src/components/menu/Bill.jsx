import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice } from "../../redux/slices/cartSlice";
import {
  addOrder,
  createOrderMpesa,
  updateTable,
  verifyPaymentMpesa,
} from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";

// Receipt Preview Component
const ReceiptPreview = ({ orderInfo, setShowPreview }) => {
  const receiptRef = useRef(null);

  const handlePrint = () => {
    if (!orderInfo) return;

    const printContent = receiptRef.current.innerHTML;
    const WinPrint = window.open("", "", "width=900,height=650");

    WinPrint.document.write(`
      <html>
        <head>
          <title>Order Receipt Preview</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              background-color: #f5f5f5;
            }
            .receipt-container { 
              width: 400px; 
              margin: 0 auto;
              background: white;
              border: 1px solid #ddd; 
              padding: 20px;
              border-radius: 8px;
            }
            h2 { 
              text-align: center; 
              margin-bottom: 20px;
              color: #025cca;
            }
            .receipt-details {
              margin: 15px 0;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 14px;
            }
            .receipt-total {
              font-weight: bold;
              font-size: 16px;
              margin-top: 10px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-[#1f1f1f] p-6 rounded-lg shadow-2xl w-[450px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-[#f5f5f5] mb-4 text-center">
          📋 Receipt Preview
        </h2>

        {/* Receipt Content */}
        <div 
          ref={receiptRef} 
          className="bg-[#f5f5f5] p-4 rounded-lg text-black"
        >
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold">RESTRO</h3>
            <p className="text-xs text-gray-600">Restaurant POS</p>
          </div>

          <hr className="my-3" />

          {/* Customer Details */}
          <div className="text-sm mb-4">
            <p>
              <strong>Customer:</strong> {orderInfo.customerName}
            </p>
            <p>
              <strong>Phone:</strong> {orderInfo.customerPhone}
            </p>
            <p>
              <strong>Guests:</strong> {orderInfo.guests}
            </p>
            <p>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>

          <hr className="my-3" />

          {/* Items */}
          <div className="mb-4">
            <h4 className="font-bold text-sm mb-2">Items Ordered</h4>
            {orderInfo.items && orderInfo.items.length > 0 ? (
              <div className="text-xs space-y-1">
                {orderInfo.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>₹{(item.price * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600">No items</p>
            )}
          </div>

          <hr className="my-3" />

          {/* Bills */}
          <div className="text-sm space-y-1 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <strong>₹{orderInfo.total?.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Tax (5.25%):</span>
              <strong>₹{orderInfo.tax?.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between text-base font-bold bg-yellow-100 p-2 rounded">
              <span>Total:</span>
              <span>₹{orderInfo.totalWithTax?.toFixed(2)}</span>
            </div>
          </div>

          <hr className="my-3" />

          {/* Payment Method */}
          <div className="text-sm mb-4 text-center">
            <p>
              <strong>Payment Method:</strong> {orderInfo.paymentMethod}
            </p>
          </div>

          <div className="text-center text-xs text-gray-600 mt-4">
            <p>Thank you for your order!</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handlePrint}
            className="flex-1 bg-[#025cca] text-[#f5f5f5] py-3 rounded-lg font-semibold hover:bg-[#0247a3] transition"
          >
            🖨️ Print
          </button>
          <button
            onClick={() => setShowPreview(false)}
            className="flex-1 bg-[#383737] text-[#f5f5f5] py-3 rounded-lg font-semibold hover:bg-[#454545] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Bill = () => {
  const dispatch = useDispatch();

  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  const taxRate = 5.25;
  const tax = (total * taxRate) / 100;
  const totalPriceWithTax = total + tax;

  const [paymentMethod, setPaymentMethod] = useState();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();
  const [showPreview, setShowPreview] = useState(false);

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      enqueueSnackbar("Please select a payment method!", {
        variant: "warning",
      });
      return;
    }

    if (paymentMethod === "Online") {
      // M-Pesa Online Payment
      if (!phoneNumber.trim()) {
        enqueueSnackbar("Please enter your phone number for M-Pesa payment!", {
          variant: "warning",
        });
        return;
      }

      try {
        // Create M-Pesa order
        const reqData = {
          amount: Math.ceil(totalPriceWithTax),
          phoneNumber: phoneNumber,
        };

        const { data } = await createOrderMpesa(reqData);

        if (data.success) {
          enqueueSnackbar(
            "M-Pesa prompt sent! Please enter your PIN to complete payment.",
            {
              variant: "info",
            }
          );

          // Place the order
          const orderData = {
            customerDetails: {
              name: customerData.customerName,
              phone: customerData.customerPhone,
              guests: customerData.guests,
            },
            orderStatus: "In Progress",
            bills: {
              total: total,
              tax: tax,
              totalWithTax: totalPriceWithTax,
            },
            items: cartData,
            table: customerData.table.tableId,
            paymentMethod: paymentMethod,
            paymentData: {
              checkoutRequestId: data.checkoutRequestId,
              merchantRequestId: data.merchantRequestId,
              mpesaPhoneNumber: data.phoneNumber,
              mpesaAmount: data.amount,
            },
          };

          setTimeout(() => {
            orderMutation.mutate(orderData);
          }, 2000);
        } else {
          enqueueSnackbar("Failed to initiate M-Pesa payment!", {
            variant: "error",
          });
        }
      } catch (error) {
        console.log(error);
        enqueueSnackbar("M-Pesa Payment Error!", {
          variant: "error",
        });
      }
    } else {
      // Cash Payment - Place order directly
      const orderData = {
        customerDetails: {
          name: customerData.customerName,
          phone: customerData.customerPhone,
          guests: customerData.guests,
        },
        orderStatus: "In Progress",
        bills: {
          total: total,
          tax: tax,
          totalWithTax: totalPriceWithTax,
        },
        items: cartData,
        table: customerData.table.tableId,
        paymentMethod: paymentMethod,
      };
      orderMutation.mutate(orderData);
    }
  };

  const orderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (resData) => {
      const { data } = resData.data;
      console.log(data);

      setOrderInfo(data);

      // Update Table
      const tableData = {
        status: "Booked",
        orderId: data._id,
        tableId: data.table,
      };

      setTimeout(() => {
        tableUpdateMutation.mutate(tableData);
      }, 1500);

      enqueueSnackbar("Order Placed!", {
        variant: "success",
      });
      setShowInvoice(true);
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const tableUpdateMutation = useMutation({
    mutationFn: (reqData) => updateTable(reqData),
    onSuccess: (resData) => {
      console.log(resData);
      dispatch(removeCustomer());
      dispatch(removeAllItems());
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handlePrintPreview = () => {
    const previewData = {
      customerName: customerData.customerName,
      customerPhone: customerData.customerPhone,
      guests: customerData.guests,
      items: cartData,
      total: total,
      tax: tax,
      totalWithTax: totalPriceWithTax,
      paymentMethod: paymentMethod,
    };
    setOrderInfo(previewData);
    setShowPreview(true);
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Items({cartData.lenght})
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ₹{total.toFixed(2)}
        </h1>
      </div>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">Tax(5.25%)</p>
        <h1 className="text-[#f5f5f5] text-md font-bold">₹{tax.toFixed(2)}</h1>
      </div>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Total With Tax
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ₹{totalPriceWithTax.toFixed(2)}
        </h1>
      </div>
      <div className="flex items-center gap-3 px-5 mt-4">
        <button
          onClick={() => setPaymentMethod("Cash")}
          className={`bg-[#1f1f1f] px-4 py-3 w-full rounded-lg text-[#ababab] font-semibold ${
            paymentMethod === "Cash" ? "bg-[#383737]" : ""
          }`}
        >
          Cash
        </button>
        <button
          onClick={() => setPaymentMethod("Online")}
          className={`bg-[#1f1f1f] px-4 py-3 w-full rounded-lg text-[#ababab] font-semibold ${
            paymentMethod === "Online" ? "bg-[#383737]" : ""
          }`}
        >
          Online
        </button>
      </div>

      {paymentMethod === "Online" && (
        <div className="px-5 mt-4">
          <input
            type="text"
            placeholder="Enter M-Pesa phone number (254...)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#1f1f1f] text-[#f5f5f5] border border-[#383737] focus:border-[#025cca] outline-none"
          />
        </div>
      )}

      <div className="flex items-center gap-3 px-5 mt-4">
        <button 
          onClick={handlePrintPreview}
          className="bg-[#025cca] px-4 py-3 w-full rounded-lg text-[#f5f5f5] font-semibold text-lg hover:bg-[#0247a3] transition"
        >
          Print Receipt
        </button>
        <button
          onClick={handlePlaceOrder}
          className="bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg hover:bg-[#d99e00] transition"
        >
          Place Order
        </button>
      </div>

      {showPreview && (
        <ReceiptPreview orderInfo={orderInfo} setShowPreview={setShowPreview} />
      )}

      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;
