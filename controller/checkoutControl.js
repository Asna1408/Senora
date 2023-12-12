const asyncHandler = require("express-async-handler");
const checkoutHelper = require("../helpers/checkoutHelper");
const User = require("../models/usermodel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const validateMongoDbId = require("../utility/validateMongoDbId");
const OrderItems = require("../models/orderItemModel");
const Coupon = require("../models/couponModel");
const Razorpay = require("razorpay");
const Wallet = require("../models/walletModel");
const WalletTransaction = require("../models/walletTransactionModel");

/**
 * Checkout Page Route
 * Method POST
 */
const checkoutpage = asyncHandler(async (req, res) => {
    try {
        const userid = req.user._id;
        const user = await User.findById(userid).populate("addresses");
        const cartItems = await checkoutHelper.getCartItems(userid);
        const cartData = await Cart.findOne({ user: userid });
        let wallet = await Wallet.findOne({ user: userid });
     
        const coupon =
        (await Coupon.findOne({ code: req?.session?.coupon?.code, expiryDate: { $gt: Date.now() } })) || null;
    const availableCoupons = await Coupon.find({ expiryDate: { $gt: Date.now() } })
        .select({ code: 1, _id: 0 })
        .limit(4);

    if (!wallet) {
        wallet = await Wallet.create({
            user: userid,
        });
    }

        if (cartItems) {
            const { subtotal, total ,discount} = await checkoutHelper.calculateTotalPrice(
                cartItems,
                userid,
                false,
                Coupon
                
            );

            if (!cartItems.products.length) {
                res.redirect("/cart");
            }

            let couponMessage = {};
            if (!coupon) {
                const coupons = availableCoupons.map((coupon) => coupon.code).join(" | ");
                couponMessage = { status: "text-info", message: "Try " + coupons };
            }
            

            res.render("user/pages/checkout", {
                title: "Checkout",
                page: "checkout",
                address: user.addresses,
                product: cartItems.products,
                total,
                subtotal,
                cartData,
                wallet,
                discount,
                 coupon,
                couponMessage,
                
            });
        }
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Checkout Page Route
 * Method GET
 */
const placeOrder = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressId, payment_method, isWallet } = req.body;  // Retrieve payment_method from the request body
        const couponCode = req.session.coupon ? req.session.coupon.code : null;
        const coupon = (await Coupon.findOne({ code: couponCode, expiryDate: { $gt: Date.now() } })) || null;
        const newOrder = await checkoutHelper.placeOrder(userId, addressId, payment_method, isWallet,coupon);  // Use payment_method here
        console.log(newOrder,"newOrder")
        console.log(payment_method,"hiiiiiiiiiiiiiiiiiiiiiii")
        if (payment_method === "cash_on_delivery") {
            res.status(200).json({
                message: "Order placed successfully",
                orderId: newOrder._id,
            });
        } else if (payment_method === "online_payment") {
            const user = await User.findById(req.user._id);
            const wallet = await Wallet.findOne({ user: userId });
            let totalAmount = 0;

            if (isWallet) {
                totalAmount = newOrder.totalPrice;
                totalAmount -= wallet.balance || 0;
                console.log(totalAmount,"totalamount")
                newOrder.paidAmount = totalAmount;
                newOrder.wallet = wallet.balance;
                console.log(newOrder.wallet,"newOrderwallet")
                await newOrder.save();
                const walletTransaction = await WalletTransaction.create({
                    wallet: wallet._id,
                    event: "Order Placed",
                    orderId: newOrder.orderId,
                    amount: wallet.balance,
                    type: "debit",
                });
             
            } else if (!isWallet) {
                totalAmount = newOrder.totalPrice;
                newOrder.paidAmount = totalAmount;
                await newOrder.save();
            }
            var instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            });
            const rzp_order = instance.orders.create(
                {
                    amount: totalAmount * 100,
                    currency: "INR",
                    receipt: newOrder.orderId,
                },
                (err, order) => {
                    if (err) {
                        res.status(500).json(err);
                    }
                    res.status(200).json({
                        message: "Order placed successfully",
                        rzp_order,
                        order,
                        user,
                        walletAmount: wallet?.balance,
                        orderId: newOrder._id,
                    });
                }
            );




            }
            else if (payment_method === "wallet_payment") {
                //  Wallet payment redirect
                const wallet = await Wallet.findOne({ user: userId });
                wallet.balance -= newOrder.wallet;
                console.log(wallet.balance,"wallet balance")
                console.log(newOrder.wallet,"neworder")
                wallet.save();
                newOrder.wallet = newOrder.totalPrice;
                await newOrder.save();
                const walletTransaction = WalletTransaction.create({
                    wallet: wallet._id,
                    event: "Order Placed",
                    orderId: newOrder.orderId,
                    amount: newOrder.totalPrice,
                    type: "debit",
                });
                res.status(200).json({
                    message: "Order placed successfully",
                    orderId: newOrder._id,
                });
        } else {
            res.status(400).json({ message: "Invalid payment method" });
        }
    } catch (error) {
        throw new Error(error);
    }
    
});



/**
 * Get Cart Data
 */
const getCartData = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const cartData = await Cart.findOne({ user: userId });
        res.json(cartData);
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Order Placed
 * Method GET
 */
const orderPlaced = asyncHandler(async (req, res) => {
    try {
        const orderId = req.query.id;
        
        const couponCode = req.session.coupon ? req.session.coupon.code : null;
        const coupon = (await Coupon.findOne({ code: couponCode, expiryDate: { $gt: Date.now() } })) || null;
        const userId = req.user.id;

        // Populate the order details, including product details
        const order = await Order.findById(orderId).populate("wallet").populate({
            path: "orderItems",
            populate: {
                path: "product",
            },
        });

        const cartItems = await checkoutHelper.getCartItems(req.user.id);

        if (order.payment_method === "cash_on_delivery") {
            for (const item of order.orderItems) {
                item.isPaid = "cod";
                await item.save();
            }
        }
        else if (order.payment_method === "online_payment") {
            for (const item of order.orderItems) {
                item.isPaid = "paid";
                await item.save();
            }
            if (coupon) {
                coupon.usedBy.push(userId);
                await coupon.save();
            }
            const wallet = await Wallet.findOne({ user: req.user._id });
         
            wallet.balance -= order.wallet;
            console.log(order.wallet,"orderwallet")
            console.log(wallet.balance,"wallet balance")
            await wallet.save();
            
        } else if (order.payment_method === "wallet_payment") {
            for (const item of order.orderItems) {
                item.isPaid = "paid";
                await item.save();
            }
            if (coupon) {
                coupon.usedBy.push(userId);
                await coupon.save();
            }
            const wallet = await Wallet.findOne({ user: req.user._id });
            wallet.balance -= order.wallet;
            await wallet.save();
        }
        
        if (cartItems) {
            for (const cartItem of cartItems.products) {
                const updateProduct = await Product.findById(cartItem.product._id);
                updateProduct.quantity -= cartItem.quantity;
                updateProduct.sold += cartItem.quantity;
                await updateProduct.save();
                await Cart.findOneAndDelete({ user: req.user.id });
            }
        }
        req.session.coupon = null;
        

        // Render the order placed page with orderDetails
        res.render("user/pages/orderPlaced", {
            title: "Order Placed",
            page: "Order Placed",
            order: order,
        });
    } catch (error) {
        throw new Error(error);
    }
});


/**
 * Vefify Payment
 * Method POST
 */
const verifyPayment = asyncHandler(async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId, walletAmount, userId } = req.body;
        const result = await checkoutHelper.verifyPayment(
            razorpay_payment_id,
            razorpay_order_id,  
            razorpay_signature,
            orderId
           
        );     

        if (result) {
            const wallet = await Wallet.findOneAndUpdate(
                { user: userId },
                {
                    balance: walletAmount,
                }
            );
           
        }

        res.json(result);
    } catch (error) {
        throw new Error(error);
    }
});



const updateCheckoutPage = asyncHandler(async (req, res) => {
    try {
        const userid = req.user._id;
        const coupon = (await Coupon.findOne({ code: req.body.code, expiryDate: { $gt: Date.now() } })) || null;
        const user = await User.findById(userid).populate("addresses");
        const cartItems = await checkoutHelper.getCartItems(userid);
        if (coupon) {
            const { subtotal, total, usedFromWallet, walletBalance, discount } = await checkoutHelper.calculateTotalPrice(
                cartItems,
                userid,
                req.body.payWithWallet,
                coupon
            );
            res.json({ total, subtotal, usedFromWallet, walletBalance, discount });
        } else {
        
            const { subtotal, total,usedFromWallet,walletBalance,discount } = await checkoutHelper.calculateTotalPrice(
                cartItems,
                userid, // need to check and do this on nect week
                req.body.payWithWallet,
                coupon
            );
            res.json({ total, subtotal, usedFromWallet, walletBalance, discount  });
        }
    }
    catch (error) {
        throw new Error(error);
    }
});

const updateCoupon = asyncHandler(async (req, res) => {
    try {
        const userid = req.user._id;
        const coupon = await Coupon.findOne({
            code: req.body.code,
            expiryDate: { $gt: Date.now() },
        });

        const cartItems = await checkoutHelper.getCartItems(userid);
        const availableCoupons = await Coupon.find({
            expiryDate: { $gt: Date.now() },
            usedBy: { $nin: [userid] },
        })
            .select({ code: 1, _id: 0 })
            .limit(4);
        const { subtotal, total, discount } = await checkoutHelper.calculateTotalPrice(cartItems, userid, false, coupon);

        if (!coupon) {
            if (req.body.data === "onLoad" || req.body.data === "onUpdate") {
                const coupons = availableCoupons.map((coupon) => coupon.code).join(" | ");
                res.status(202).json({
                    status: "info",
                    message: "Try " + coupons,
                    subtotal,
                    total,
                    discount,
                });
            } else {
                res.status(202).json({
                    status: "danger",
                    message: "The coupon is invalid or expired.",
                    subtotal,
                    total,
                    discount,
                });
            }
        } else {
            if (coupon.usedBy.includes(userid)) {
                res.status(202).json({
                    status: "danger",
                    message: "The coupon is alrady used",
                });
            } else if (subtotal < coupon.minAmount) {
                res.status(200).json({
                    status: "danger",
                    message: `You need to spend at least ${coupon.minAmount} to get this offer.`,
                });
            } else {
                req.session.coupon = coupon;
                res.status(200).json({
                    status: "success",
                    message: `${coupon.code} applied`,
                    coupon: coupon,
                    subtotal,
                    total,
                    discount,
                });
            }
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
});


/**
 * Remove Coupon Applied Coupon
 * Mehtod GET
 */
const removeAppliedCoupon = asyncHandler(async (req, res) => {
    req.session.coupon = null;
    res.status(200).json("Ok");
});



module.exports = {
    removeAppliedCoupon,
    checkoutpage,
    updateCoupon ,
 placeOrder,
 getCartData,orderPlaced,
 updateCheckoutPage,
 verifyPayment
}