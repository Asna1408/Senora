const express = require("express")
 const userRoute=express.Router()
 const passport = require('passport')

const userController = require("../controller/userCtrl")
const cartController = require('../controller/cartController')
const addressController = require('../controller/addressControl')
const checkoutController = require("../controller/checkoutControl");
const orderController = require("../controller/orderControl");


const { ensureNotAuthenticated, ensureAuthenticated } = require('../middlewares/userAuth')
const {validationResult} = require('../middlewares/idValidation')

userRoute.use((req, res, next) => {
    req.app.set('layout', 'user/layout/user');
    next();
  })

// userRoute setting----
userRoute.get('/', userController.loadLandingPage); /* Loading home page */
userRoute.get('/register', ensureNotAuthenticated, userController.loadRegister); /* Register Page */
userRoute.post('/register', ensureNotAuthenticated, userController.insertUser);
userRoute.get('/sendOTP', ensureNotAuthenticated, userController.sendOTPpage); /* otp sending */
userRoute.post('/sendOTP', ensureNotAuthenticated, userController.verifyOTP);
userRoute.get('/reSendOTP', ensureNotAuthenticated, userController.reSendOTP); /* otp Resending */
userRoute.post('/reSendOTP', ensureNotAuthenticated, userController.verifyResendOTP);



userRoute.get('/shop',userController.loadShop);// loading shop page
userRoute.get('/about',userController.loadAbout);// loading about page
userRoute.get('/contact',userController.loadContact);// loading contact page
userRoute.get('/account',ensureAuthenticated,userController.loadAccount);// loading Account page
userRoute.get('/product',userController.loadProduct);



// Login & Verification section---
userRoute.get('/login', ensureNotAuthenticated, userController.loadLogin);
userRoute.post('/login', ensureNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/', // Redirect on successful login
    failureRedirect: '/login', // Redirect on failed login
    failureFlash: true, // enable flash messages
  }));
userRoute.get('/logout', ensureAuthenticated, userController.userLogout);



// <!--cartMangement-->
userRoute.get('/cart',ensureAuthenticated,cartController.cartpage);
userRoute.get('/add/:id',ensureAuthenticated,cartController.addToCart);
userRoute.get('/remove/:id',ensureAuthenticated,cartController. removeFromCart);
userRoute.get('/cart/inc/:id', ensureAuthenticated,cartController.incQuantity);
userRoute.get('/cart/dec/:id', ensureAuthenticated, cartController.decQuantity);


// <!--AddressManagment-->
userRoute.get('/savedAddress', ensureAuthenticated, addressController.savedAddress)
userRoute.get('/addAddress', ensureAuthenticated, addressController.addAddressPage)
userRoute.post('/addAddress', ensureAuthenticated, addressController.insertAddress)
userRoute.get('/updateAddress',ensureAuthenticated,addressController.editData)
userRoute.post('/editAddress', ensureAuthenticated, addressController.updateAddress)
userRoute.get('/deleteAddress/:id', ensureAuthenticated, addressController.deleteAddress)


// <!--Checkout routes-->
userRoute.post("/checkout", ensureAuthenticated, checkoutController.checkoutpage);
userRoute.get("/checkout/get", ensureAuthenticated, checkoutController.getCartData);
userRoute.post("/place-order",  ensureAuthenticated,checkoutController.placeOrder);
userRoute.get("/order-placed", ensureAuthenticated, checkoutController.orderPlaced);
userRoute.post("/update",  ensureAuthenticated,checkoutController.updateCheckoutPage);
userRoute.post("/coupon", ensureAuthenticated, checkoutController.updateCoupon);
userRoute.get("/coupon/remove", ensureAuthenticated, checkoutController.removeAppliedCoupon);
userRoute.post("/verify-payment", ensureAuthenticated, checkoutController.verifyPayment);


// <!--Order routes-->
userRoute.get("/orders",  ensureAuthenticated,orderController.orderspage);
userRoute.get("/singleorders", ensureAuthenticated, orderController.singleOrder);
userRoute.put("/orders/:id", ensureAuthenticated, orderController.cancelOrder);
userRoute.post("/orders/single/:id", ensureAuthenticated, orderController.cancelSingleOrder);
userRoute.post("/orders/return/:id", ensureAuthenticated, orderController.returnOrder);
userRoute.get("/orders/download/:id", orderController.donwloadInvoice);

//<!--review routes-->
userRoute.post("/review/add/:id", ensureAuthenticated,userController.addReview);


//<!--wishlist routes-->
userRoute.get('/wishlist', ensureAuthenticated,userController.wishlistpage);
userRoute.get('/my-wishlist/:productID', ensureAuthenticated, userController.userWishlist_add );
userRoute.get('/removeItem/:productID', ensureAuthenticated,userController.wishlistDelete_get);


//<!--profile routes-->
userRoute.post('/edit-profile', ensureAuthenticated,userController. editProfilePost);
userRoute.put('/editpsw', ensureAuthenticated, userController.UpdatePassword);
userRoute.get('/forget',ensureNotAuthenticated,userController.forgetLoad)
userRoute.post('/forget', ensureNotAuthenticated,userController.forgetpswd)
userRoute.get('/forget-password',ensureNotAuthenticated,userController.forgetPswdload);
userRoute.post('/forget-password',ensureNotAuthenticated, userController.resetPswd)


//<--payment routes-->
userRoute.get("/wallet",ensureAuthenticated, userController.walletTransactionspage);




// 404 notfound page--
userRoute.get('*',(req,res)=>{res.render('./user/pages/404')})



module.exports=userRoute;
