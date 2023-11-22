const asyncHandler = require("express-async-handler");
const {
    getOrders,
    getSingleOrder,
    cancelOrderById,
    cancelSingleOrder,
    returnOrder,
    getReview,
} = require("../helpers/orderHelper");
const orderItem=require("../models/orderItemModel")

/**
 * Orders Page Route
 * Method GET
 */
exports.orderspage = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id
        const orders = await getOrders(userId);
//console.log(orders[0].orderItems[0].product)

        res.render("user/pages/orders", {title: "Orders",  page: "orders",orders});
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Checkout Page Route
 * Method GET
 */
exports.singleOrder = asyncHandler(async (req, res) => {
    try {
        const orderId = req.query.id;

        const { order, orders } = await getSingleOrder(orderId);
        const review = await getReview(req.user._id, order.product._id);

        res.render("user/pages/singleOrder.ejs", {  title: order.product.title, page: order.product.title, order, orders,review});
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Cancel Order Route
 * Method PUT
 */
exports.cancelOrder = asyncHandler(async (req, res) => {
    try {
        const orderId = req.params.id;

        const result = await cancelOrderById(orderId);

        if (result === "redirectBack") {
            res.redirect("back");
        } else {
            res.json(result);
        }
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Cancel Single Order Route
 * Method PUT
 */
exports.cancelSingleOrder = asyncHandler(async (req, res) => {
    try {
        console.log(req.params.id)
        const orderItemId = req.params.id;
        console.log(orderItemId,">>>>>>>>>>>>>>>>>>>>>>>>")

        const result = await cancelSingleOrder(orderItemId, req.user._id);

        if (result === "redirectBack") {
            res.redirect("back");
        } else {
            res.json(result);
        }
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Return Order Requst
 * Method POST
 */
exports.returnOrder = asyncHandler(async (req, res) => {
    try {
        const returnOrderItemId = req.params.id;
        const result = await returnOrder(returnOrderItemId);

        if (result === "redirectBack") {
            res.redirect("back");
        } else {
            res.json(result);
        }
    } catch (error) {
        throw new Error(error);
    }
});