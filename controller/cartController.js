const User = require('../models/usermodel')
const validateMongoDbId = require('../utility/validateMongoDbId')
const Product = require('../models/productModel')
const asyncHandler = require('express-async-handler');
const Cart = require('../models/cartModel')
const { incrementQuantity, decrementQuantity, calculateCartTotals } = require("../helpers/cartHelper");
const { default: mongoose } = require('mongoose');
const Coupon = require("../models/couponModel");



const cartpage = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const coupon = req.session.coupon || null;
    const messages = req.flash();
    const availableCoupons = await Coupon.find({ expiryDate: { $gt: Date.now() } })
    .select({ code: 1, _id: 0 })
    .limit(4);

    try {

        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: "products.product",
                populate: {
                    path: "primaryImage",
                    model: "Product",
                },
            })
            .exec();


        const getallData = await Cart.aggregate([
            {
                $match: { user: userId }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: "productDetails",
                }
            }
        ]);




        if ( getallData.length!==0) {
           
            const { subtotal, total,discount } = calculateCartTotals(cart.products);
            let couponMessage = {};
            if (!coupon) {
                const coupons = availableCoupons.map((coupon) => coupon.code).join(" | ");
                couponMessage = { status: "text-info", message: "Try " + coupons };
            }
            res.render("user/pages/cart", {
                title: "Cart",
                page: "cart",
                cartItems: cart,
                messages,
                subtotal,
                total,
                getallData: getallData,
                coupon,
                discount,
                couponMessage,

            });

        } else {
            res.render("user/pages/cart", { title: "Cart", page: "cart", messages, cartItems: null, getallData:[],subtotal:0,total:0});
        }
    } catch (error) {
        throw new Error(error);
    }
});



const addToCart = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const userId = req.user.id;
    validateMongoDbId(productId);

    try {
        const product = await Product.findById(productId);

        let existingProduct2 = false;
        let existingProduct3 = false;


        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.quantity < 1) {
            return res.status(400).json({ message: "Product is out of stock" });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            existingProduct3 = true;
            cart = await Cart.create({
                user: userId,
                products: [{ product: productId, quantity: 1 }],
            });
        } else {
            const existingProduct = cart.products.find((item) => item.product.equals(productId));

            if (existingProduct) {
                if (product.quantity <= existingProduct.quantity) {
                    return res.json({
                        message: "Out of Stock",
                        status: "danger",
                        count: cart.products.length,
                    });
                }
                existingProduct.quantity += 1;
            } else {
                existingProduct2 = cart.products.push({ product: productId, quantity: 1 });
            }

            await cart.save();
            if (existingProduct || existingProduct2 || existingProduct3) {
                res.redirect('/cart')
            }
        }



    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Remove From Cart Route
 * Method GET
 */
const removeFromCart = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const userId = req.user.id;
    validateMongoDbId(productId);
    try {
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
            cart.products = cart.products.filter((product) => product.product.toString() !== productId);
            await cart.save();
        }
        req.flash("warning", `Item Removed`);
        res.redirect("back");
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Increment Quantity Route
 * Method PUT
 */
const incQuantity = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user._id;
        validateMongoDbId(productId);

        await incrementQuantity(userId, productId, res);
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Decrement Quantity Route
 * Method PUT
 */
const decQuantity = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user._id;
        validateMongoDbId(productId);

        await decrementQuantity(userId, productId, res);
    } catch (error) {
        throw new Error(error);
    }
});


module.exports = {
    cartpage,
    addToCart,
    removeFromCart,
    decQuantity,
    incQuantity,

}