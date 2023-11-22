const express = require('express');
const adminRoute = express.Router();
const adminController = require("../controller/adminControl")
const categoryController = require('../controller/categoryControl')
const productController = require('../controller/productControl')
const BannerController = require('../controller/bannerController')

const { upload } = require('../config/upload')
const { isAdminLoggedIn, isAdminLoggedOut } = require('../middlewares/adminAuth')
const nocache = require('nocache')
require('dotenv').config()

adminRoute.use((req, res, next) => {
    req.app.set('layout', 'admin/layouts/adminLayout');
    next();
})

adminRoute.use(nocache())

// admin loginManagement---
adminRoute.get('/', isAdminLoggedOut, adminController.loadLogin)
adminRoute.post('/', adminController.verifyAdmin);
adminRoute.get('/logout', isAdminLoggedIn, adminController.logout)

// userManagement---
adminRoute.get('/dashboard', isAdminLoggedIn, adminController.loadDashboard)
adminRoute.get('/user', isAdminLoggedIn, adminController.userManagement)
adminRoute.post('/user/search', isAdminLoggedIn, adminController.searchUser)
adminRoute.post('/user/blockUser/:userId', isAdminLoggedIn, adminController.blockUser)
adminRoute.post('/user/unBlockUser/:id', isAdminLoggedIn, adminController.unBlockUser)

// categoryManagement--- 
adminRoute.get('/category', isAdminLoggedIn, categoryController.categoryManagement)
adminRoute.get('/addCategory', isAdminLoggedIn, categoryController.addCategory)
adminRoute.post('/addCategory', isAdminLoggedIn, categoryController.insertCategory)
adminRoute.get('/category/list/:id', isAdminLoggedIn, categoryController.list)
adminRoute.get('/category/unList/:id', isAdminLoggedIn, categoryController.unList)
adminRoute.get('/editCategory/:id', isAdminLoggedIn, categoryController.editCategory)
adminRoute.post('/editCategory/:id', isAdminLoggedIn, categoryController.updateCategory)
adminRoute.post('/category/search', isAdminLoggedIn, categoryController.searchCategory)


// // Product Management---
adminRoute.get('/product/addProduct', isAdminLoggedIn, productController.addProduct)
 
adminRoute.post('/product/addProduct',
    upload.fields([
        { name: "secondaryImage",maxCount:10 }
        , { name: "primaryImage" ,}]),
    productController.insertProduct)  /** Product adding and multer using  **/
adminRoute.get('/product', isAdminLoggedIn, productController.productManagement)
adminRoute.post('/product/list/:id', isAdminLoggedIn, productController.listProduct)
adminRoute.post('/product/unList/:id', isAdminLoggedIn, productController.unListProduct)
adminRoute.get('/product/editproduct/:id', isAdminLoggedIn, productController.editProductPage)
adminRoute.post('/product/editproduct/:id',
    upload.fields([
        { name: "secondaryImage",maxCount:10 }
        ,{ name: "primaryImage",maxCount:3 }]),
    productController.updateProduct)
adminRoute.post('/product/deleteproductimage',isAdminLoggedIn,productController.deleteImage)    
   
// OrderManagement--
adminRoute.get("/orders", adminController.ordersPage);
adminRoute.get("/orders/:id", adminController.editOrder);
adminRoute.post("/orders/update/:id", adminController.OrderStatusupdate);
adminRoute.post("/orders/search", adminController.searchOrder);

//CouponMnagement
adminRoute.get("/coupon", adminController.couponspage);
adminRoute.get("/coupon/add", adminController.addCoupon);
adminRoute.get("/coupon/edit/:id", adminController.editCouponPage);
adminRoute.post("/coupon/add", adminController.createCoupon);
adminRoute.post("/coupon/edit/:id", adminController.updateCoupon);


 //<!--BnnerManagement-->
adminRoute.get('/banner', BannerController.banner_get);
adminRoute.get('/banner/newBanner', BannerController.newBanner_get);
adminRoute.post('/banner/newBanner', upload.fields([{ name: 'bannerImage' }]), BannerController.newBanner_post);
adminRoute.get('/banner/editBanner/:bannerId', BannerController.bannerEdit_get);
adminRoute.post('/banner/editBanner', upload.fields([{ name: 'bannerImage' }]), BannerController.bannerEdit_post);
adminRoute.get('/banner/deleteBanner/:id', BannerController.bannerDelete_get)



adminRoute.get('*', (req, res) => { res.render('./admin/page404', { title: 'Error' }) })

module.exports=adminRoute