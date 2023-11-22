const asyncHandler = require("express-async-handler");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");

const OrderItem = require("../models/orderItemModel");
const { default: mongoose } = require("mongoose");
const {status} =require("../utility/status")
const Review = require('../models/reviewModel')
const Wallet = require("../models/walletModel");
const WalletTransactoins = require("../models/walletTransactionModel");
const Coupon = require("../models/couponModel");


module.exports = {
   
    getOrders: asyncHandler(async (userId) => {
        const user = new mongoose.Types.ObjectId(userId)
        const orders = await Order.find({ user})
// .populate(
//     'orderItems'
// )
// console.log(orders[0])




            .populate({
                path: "orderItems",
                select: "product status _id",
                populate: {
                    path: "product",
                    select: "title primaryImage",
                    
                },
            })
            // .select("orderId orderedDate shippingAddress city")
            // .sort({ _id: -1 });

        return orders;
        // const orders= await Order.aggregate([
        //     {
        //         $match:{
        //           user
        //         }
        //     },
        // {
        //     $lookup:{
        //         from: 'products',
        //         localField: 'product',
        //         foreignField: '_id',
        //         as: "productDetails",
        //     }
        // },
        // {
        //     $unwind:{
         
        //     }
        // }
        // ])
        
    }),

    getSingleOrder: asyncHandler(async (orderId) => {
        const order = await OrderItem.findById(orderId).populate({
            path: "product",
            model: "Product",
            populate: {
                path: "primaryImage",
                model:"Product"
         
            },
        });

        const orders = await Order.findOne({ orderItems: orderId }).select("shippingAddress city orderedDate");

        return { order, orders };
    }),

    cancelOrderById: asyncHandler(async (orderId) => {
        const order = await Order.findById(orderId).populate("orderItems");

        if (order.orderItems.every((item) => item.status === status.cancelled)) {
            return { message: "Order is already cancelled." };
        }


        if (
            order.payment_method === "online_payment" &&
            order.orderItems.every((item) => {
                return item.isPaid === "pending" ? false : true;
            })
        ) {
            // Update product quantities and sold counts for each order item
            for (const item of order.orderItems) {
                const orderItem = await OrderItem.findByIdAndUpdate(item._id, {
                    status: status.cancelled,
                });

                const cancelledProduct = await Product.findById(orderItem.product);
                cancelledProduct.quantity += orderItem.quantity;
                cancelledProduct.sold -= orderItem.quantity;
                await cancelledProduct.save();
            }

            // Update the order status
            order.status = status.cancelled;
            const updatedOrder = await order.save();

            return updatedOrder;

        } else if (order.payment_method === "cash_on_delivery") {
            
            // Update product quantities and sold counts for each order item
            for (const item of order.orderItems) {
                await OrderItem.findByIdAndUpdate(item._id, {
                    status: status.cancelled,
                });

                const cancelledProduct = await Product.findById(item.product);
                cancelledProduct.quantity += item.quantity;
                cancelledProduct.sold -= item.quantity;
                await cancelledProduct.save();
            }

            // Update the order status
            order.status = status.cancelled;
            await order.save();

            return "redirectBack";
        }
    }),

    cancelSingleOrder: asyncHandler(async (orderItemId, userId) => {
        console.log(orderItemId,"?????????????????")
        const updatedOrder = await OrderItem.findByIdAndUpdate({_id:orderItemId},{$set:{status : "Cancelled"}});
        console.log(updatedOrder,"pdpdpdpdpdpdpd")
        console.log("hiiiiiiiiiiiiiiiiiiiiiiiiiiiiii")

   if (updatedOrder.isPaid !== "pending") {
            const cancelledProduct = await Product.findById(updatedOrder.product);
            cancelledProduct.quantity += updatedOrder.quantity;
            cancelledProduct.sold -= updatedOrder.quantity;
            await cancelledProduct.save();
        }
       

        
        const orders = await Order.findOne({ orderItems: orderItemId });
        if (
            (orders.payment_method === "online_payment" || orders.payment_method === "wallet_payment") &&
            updatedOrder.isPaid === "paid"
        ) {
            const wallet = await Wallet.findOne({ user: userId });
            const orderTotal = parseInt(updatedOrder.price) * updatedOrder.quantity;
            const order = await Order.findOne({ orderItems: orderItemId });
            const appliedCoupon = order.coupon;
            if (!wallet) {
                if (order.coupon) {
                    let amountToBeRefunded = 0;
                    if (appliedCoupon.type === "fixedAmount") {
                        const percentage = Math.round((orderTotal / (orders.totalPrice + orders.discount)) * 100);
                        const returnAmount = orderTotal - (appliedCoupon.value * percentage) / 100;
                        amountToBeRefunded = returnAmount;
                    } else if (appliedCoupon.type === "percentage") {
                        const returnAmount = orderTotal - (orderTotal * appliedCoupon.value) / 100;
                        amountToBeRefunded = returnAmount;
                    }
                    const newWallet = await Wallet.create({
                        balance: amountToBeRefunded,
                        user: orders.user,
                    });
                    const walletTransaction = await WalletTransactoins.create({
                        wallet: newWallet._id,
                        event: "Refund",
                        orderId: order.orderId,
                        amount: amountToBeRefunded,
                        type: "credit",
                    });
                } else {
                    const newWallet = await Wallet.create({
                        balance: orderTotal,
                        user: orders.user,
                    });
                    const walletTransaction = await WalletTransactoins.create({
                        wallet: newWallet._id,
                        event: "Refund",
                        orderId: order.orderId,
                        amount: orderTotal,
                        type: "credit",
                    });
                }
            } else {
                if (order.coupon) {
                    let amountToBeRefunded = 0;
                    if (appliedCoupon.type === "fixedAmount") {
                        const percentage = Math.round((orderTotal / (orders.totalPrice + orders.discount)) * 100);
                        const returnAmount = orderTotal - (appliedCoupon.value * percentage) / 100;
                        amountToBeRefunded = returnAmount;
                    } else if (appliedCoupon.type === "percentage") {
                        const returnAmount = orderTotal - (orderTotal * appliedCoupon.value) / 100;
                        amountToBeRefunded = returnAmount;
                    }
                    const existingWallet = await Wallet.findOneAndUpdate({ user: userId });
                    existingWallet.balance += amountToBeRefunded;

                    existingWallet.save();

                    const walletTransaction = await WalletTransactoins.create({
                        wallet: existingWallet._id,
                        amount: amountToBeRefunded,
                        event: "Refund",
                        orderId: order.orderId,
                        type: "credit",
                    });
                } else {
                    const existingWallet = await Wallet.findOneAndUpdate({ user: userId });
        

                existingWallet.balance += orderTotal;
                   
                    
                    existingWallet.save();

                    const walletTransaction = await WalletTransactoins.create({
                        wallet: existingWallet._id,
                        amount: orderTotal,
                        event: "Refund",
                        orderId: order.orderId,
                        type: "credit",
                    });
                }
            }
        }
        return "redirectBack";
        
    }),

    returnOrder: asyncHandler(async (returnOrderId) => {
        const returnOrder = await OrderItem.findByIdAndUpdate(returnOrderId, {
            status: status.returnPending,
        });

        return "redirectBack";
    }),


    getReview: asyncHandler(async (userId, productId) => {
        const review = await Review.findOne({ user: userId, product: productId });
        if (review) {
            return review;
        } else {
            return {};
        }
    }),
    
};