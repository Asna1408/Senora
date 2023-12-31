

const asyncHandler = require("express-async-handler");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const OrderItems = require("../models/orderItemModel");
const Product = require("../models/productModel");
const { generateUniqueOrderID } = require("../utility/generateUniqueId");
const Crypto = require("crypto");
const Wallet = require("../models/walletModel");

/**

/**
 * Get user's cart items
 */
exports.getCartItems = asyncHandler(async (userId) => {
    return await Cart.findOne({ user: userId }).populate("products.product");
});

/**
 * Calculate the total price of cart items
 */
exports.calculateTotalPrice = asyncHandler(async (cartItems, userid, payWithWallet, coupon ) => { //deleted payWithWallet, coupon
    const wallet = await Wallet.findOne({ user: userid });
    let subtotal = 0;
    for (const product of cartItems.products) {
        const productTotal = parseFloat(product.product.salePrice) * product.quantity;
        subtotal += productTotal;
    }
    let total;
    let usedFromWallet = 0;
    if (wallet && payWithWallet) {
        let discount = 0;
    total = subtotal;
    if (coupon) {
        if (coupon.type === "percentage") {
            discount = ((total * coupon.value) / 100).toFixed(2);
            if (discount > coupon.maxAmount) {
                discount = coupon.maxAmount;
                total -= discount;
            } else {
                total -= discount;
            }
        } else if (coupon.type === "fixedAmount") {
            discount = coupon.value;
            total -= discount;
        }
    }

    if (total <= wallet.balance) {
        usedFromWallet = total;
        wallet.balance -= total;
        total = 0;
    } else {
        usedFromWallet = wallet.balance;
        total = subtotal - wallet.balance - discount;
        wallet.balance = 0;
    }
    
        return {
            subtotal,
            total,
            usedFromWallet, 
            walletBalance: wallet.balance, 
            discount: discount ? discount : 0 }
            
        }else {
            total = subtotal;
            let discount = 0;
            if (coupon) {
                if (coupon.type === "percentage") {
                    discount = ((total * coupon.value) / 100).toFixed(2);
                    if (discount > coupon.maxAmount) {
                        discount = coupon.maxAmount;
                        total -= discount;
                    } else {
                        total -= discount;
                    }
                } else if (coupon.type === "fixedAmount") {
                    discount = coupon.value;
                    total -= discount;
                }
            }
            return {
                subtotal,
                total,
                usedFromWallet,
                walletBalance: wallet ? wallet.balance : 0,
                discount: discount ? discount : 0,
            };
        }
});

/**
 *    Place an order   */
exports.placeOrder = asyncHandler(async (userId, addressId, paymentMethod, isWallet, coupon) => {
    const cartItems = await exports.getCartItems(userId);

    if (!cartItems && cartItems.length) {
        throw new Error("Cart not found or empty");
    }

    const orders = [];
    let total = 0;

    for (const cartItem of cartItems.products) {
        const productTotal = parseFloat(cartItem.product.salePrice) * cartItem.quantity;

        total += productTotal;

        const item = await OrderItems.create({
            quantity: cartItem.quantity,
            price: cartItem.product.salePrice,
            product: cartItem.product._id,
        });
        orders.push(item);
    }

    let discount;

    if (coupon) {
        if (coupon.type === "percentage") {
            discount = ((total * coupon.value) / 100).toFixed(2);
            if (discount > coupon.maxAmount) {
                discount = coupon.maxAmount;
                total -= discount;
            } else {
                total -= discount;
            }
        } else if (coupon.type === "fixedAmount") {
            discount = coupon.value;
            total -= discount;
        }
    }

    const address = await Address.findById(addressId);

    const existingOrderIds = await Order.find().select("orderId");
    // Create the order
    const newOrder = await Order.create({
        orderId: "OD" + generateUniqueOrderID(existingOrderIds),
        user: userId,
        orderItems: orders,
        shippingAddress: address.name,
        town: address.town,
        state: address.state,
        postCode: address.postCode,
        phone: address.phone,
        totalPrice: total.toFixed(2),
          discount: discount,
        coupon: coupon ?? coupon,
        payment_method: paymentMethod

        });

    return newOrder;
});


exports.verifyPayment = asyncHandler(async (razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId) => {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = Crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(sign.toString()).digest("hex");

    if (razorpay_signature === expectedSign) {
        return { message: "success", orderId: orderId };
    } else {
        throw new Error("Payment verification failed");
    }
});
