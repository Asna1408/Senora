const expressHandler = require('express-async-handler')
const User = require('../models/usermodel')
const Order = require("../models/orderModel");
const OrderItem = require("../models/orderItemModel");
const validateMongoDbId = require("../utility/validateMongoDbId");
const { status } = require("../utility/status");
const Product = require("../models/productModel");
const  numeral = require("numeral");
const moment = require("moment")
const { handleReturnedOrder, handleCancelledOrder, updateOrderStatus } = require("../helpers/admin_orderHelper");
const { default: mongoose } = require('mongoose');
const Coupon = require('../models/couponModel')
const Wallet = require("../models/walletModel") ;

// Loading loginPage--   
const loadLogin = expressHandler(async (req, res) => {

    try {
        res.render('./admin/pages/login', { title: 'Login' })
    } catch (error) {
        throw new Error(error)
    }
})
// verifyAdmin--
const verifyAdmin = expressHandler(async (req, res) => {

    try {

        const email = process.env.ADMIN_EMAIL
        const password = process.env.ADMIN_PASSWORD

        const emailCheck = req.body.email
        const user = await User.findOne({ email: emailCheck })

        if (user) {
            res.render('./admin/pages/login', { adminCheck: 'You are not an Admin', title: 'Login' })
        }
        if (emailCheck === email && req.body.password === password) {

            req.session.admin = email;
            res.render('./admin/pages/index', { title: 'dashboard' })
        } else {
            res.render('./admin/pages/login', { adminCheck: 'Invalid Credentials', title: 'Login' })
        }

    } catch (error) {
        throw new Error(error)
    }
})


// Admin Logout--
const logout = (req, res) => {
    try {
        req.session.admin = null;
        res.redirect('/admin')
    } catch (error) {
        throw new Error(error)
    }
}

// loadDashboard---  
const loadDashboard = expressHandler(async (req, res) => {

    try {
        res.render('./admin/pages/index', { title: 'Dashboard' })
    } catch (error) {
        throw new Error(error)
    }
})

// UserManagement-- 
const userManagement = expressHandler(async (req, res) => {

    try {

        const findUsers = await User.find();

        res.render('./admin/pages/userList', { users: findUsers, title: 'UserList' })

    } catch (error) {
        throw new Error(error)
    }
})



// searchUser
const searchUser = expressHandler(async (req, res) => {

    try {

        const data = req.body.search
        const searching = await User.find({ userName: { $regex: data, $options: 'i' } });
        if (searching) {
            res.render('./admin/pages/userList', { users: searching, title: 'Search' })
        } else {
            res.render('./admin/pages/userList', { title: 'Search' })
        }


    } catch (error) {
        throw new Error(error)
    }
})

// Block a User
const blockUser = expressHandler(async (req, res) => {

    console.log("REACHED AT USER BLOCK FUNCTION")

    try {
        const userId = req.params.userId;
        const finduser = await User.findByIdAndUpdate(userId, { isBlock: true }, { new: true });
        console.log("This is the user that is blocked", finduser);

        if (finduser) {
            return res.status(200).json({ message: "User Blocked Successfully" })
        } else {
            return res.status(400).json({ error: "User Block Failed" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
     
    
});

// Unblock a User
const unBlockUser = expressHandler(async (req, res) => {

    try {
        const id = req.params.id;
        await User.findByIdAndUpdate(id, { isBlock: false }, { new: true });
        res.redirect('/admin/user');
    } catch (error) {
        throw new Error(error);
    }
});

//OrderList page---
const ordersPage = expressHandler(async (req, res) => {
    try {
        const orders = await Order.find()
            .populate({
                path: "orderItems",
                select: "product status _id",
                populate: {
                    path: "product",
                    select: "title primaryImage ",
                    
                },
            })

            .select("orderId orderedDate shippingAddress city zip totalPrice")
            .sort({ orderedDate: -1 });
        // res.json(orders);
        res.render("admin/pages/orders", { title: "Orders", orders });
    } catch (error) {
        throw new Error(error);
    }
});

//Edit OrderStatus get---
const editOrder = expressHandler(async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderData = await Order.findOne({orderId:orderId})
        console.log(orderData)
        
        const orderItemsId = orderData.orderItems[0];

        const productId = await OrderItem.findById(orderItemsId)
        console.log(productId)

        const product = productId.product
        const productData = await Product.findById(product)
       console.log(productData)

       const userId = orderData.user
       const userData = await User.findById(userId)
       console.log(userData)

        res.render("admin/pages/viewOrder", {title:'Edit Orders',orderData,productId,productData,userData});
    } catch (error) {
        throw new Error(error);
    }
});
 
//Orderstatus updatepost---
const OrderStatusupdate = expressHandler(async (req, res) => {
    try {
      const orderId = req.params.id;
  
      console.log(req.body);

      const newStatus = req.body.status;

      const order = await Order.findById(orderId);
      
      const orderdeatails = await OrderItem.findByIdAndUpdate({_id:order.orderItems[0]}, {$set : {status : newStatus}})
      
      // Check if order is null (not found)
      if (!order) {
        return res.status(404).send('Order not found');
      }
  
      if (newStatus === status.shipped) {
        order.shippedDate = Date.now();
      } else if (newStatus === status.delivered) {
        order.deliveredDate = Date.now();
      }
  
      // Save the updated order
      await order.save();
  
      if (newStatus === status.cancelled) {
        await handleCancelledOrder(order);
      }
  
      if (newStatus === status.returnPending) {
        await handleReturnedOrder(order);
      }
  
      res.redirect("back");
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  
//Order Search---
const searchOrder = expressHandler(async (req, res) => {
    try {
        const search = req.body.search;
        const order = await Order.findOne({ orderId: search });
        if (order) {
            res.redirect(`/admin/orders/${search}`);
        } else {
            req.flash("danger", "Can't find Order!");
            res.redirect("/admin/dashboard");
        }
    } catch (error) {
        throw new Error(error);
    }
});


//Couponlist page---
const couponspage = expressHandler(async (req, res) => {
   try {
       const messages = req.flash();
       const coupons = await Coupon.find().sort({ _id: 1 });
       res.render("admin/pages/coupon", { title: "Coupons", coupons, messages });
   } catch (error) {
       throw new Error(error);
   }
});


//Coupon addpage---
const addCoupon = expressHandler(async (req, res) => {
   try {
       const messages = req.flash();
       res.render("admin/pages/addCoupon", { title: "Add Coupon", messages, data: {} });
   } catch (error) {
       throw new Error(error);
   }
});

//Coupan addpost---
const createCoupon = expressHandler(async (req, res) => {
   try {
       const existingCoupon = await Coupon.findOne({ code: req.body.code });

       console.log(req.body);

       if (!existingCoupon) {
           const newCoupon = await Coupon.create({
               code: req.body.code,
               type: req.body.type,
               value: parseInt(req.body.value),
               description: req.body.description,
               expiryDate: req.body.expiryDate,
               minAmount: parseInt(req.body.minAmount),
               maxAmount: parseInt(req.body.maxAmount) || 0,
           });
           res.redirect("/admin/coupon");
       }
       req.flash("warning", "Coupon exists with same code");
       const messages=req.flash()
       res.render("admin/pages/addCoupon", { title: "Add Coupon", messages, data: req.body });
   } catch (error) {
       throw new Error(error);
   }
});

//coupon edit---
const editCouponPage = expressHandler(async (req, res) => {
   try {
       const couponId = req.params.id;
       const coupon = await Coupon.findById(couponId);
       const couponTypes = await Coupon.distinct("type");
       const messages = req.flash();
       res.render("admin/pages/editCoupon", { title: "Edit Coupon", coupon, couponTypes, messages });
   } catch (error) {
       throw new Error(error);
   }
});
/**
* Update Coupon
* Method POST
*/
const updateCoupon = expressHandler(async (req, res) => {
   try {
       const couponId = req.params.id;
       const isExists = await Coupon.findOne({ code: req.body.code, _id: { $ne: couponId } });

       if (!isExists) {
           const updtedCoupon = await Coupon.findByIdAndUpdate(couponId, req.body);
           req.flash("success", "Coupon Updated");
           res.redirect("/admin/coupon");
       } else {
           req.flash("warning", "Coupon Already Exists");
           res.redirect("back");
       }
   } catch (error) {}
});






module.exports = {
    loadLogin,
    verifyAdmin,
    loadDashboard,
    userManagement,
    searchUser,
    blockUser,
    unBlockUser,
    logout,
    ordersPage,
    editOrder,
    searchOrder,
    OrderStatusupdate,
    couponspage,
    addCoupon,
    createCoupon,
    editCouponPage,
    updateCoupon
}
