const User = require('../models/usermodel')
const asyncHandler = require('express-async-handler')
const Product = require('../models/productModel')
const Wishlist = require('../models/wishlistModel')
const { sendOtp } = require('../utility/nodeMailer')
const bcrypt = require('bcrypt');
const validateID = require('express-validator');
// Import the generateOTP function from the utility module
const { generateOTP } = require('../utility/nodeMailer'); // Adjust the path accordingly
const randomstring = require('randomstring')
const { sendVerifymail } = require('../utility/nodeMailer')
const Wallet = require('../models/walletModel')
const WalletTransaction = require("../models/walletTransactionModel");
const Review = require('../models/reviewModel')



const securePassword = async(password)=>{

    try{
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
    }catch(error){
        console.log(error.message);
    }
}


// Index
const loadLandingPage = async (req, res) => {
    try {
        const getalldata = await Product.find().populate("categoryName");
        res.render('./user/pages/index', { getalldata })

    } catch (error) {
        throw new Error(error)
    }

}
// loading register page---
const loadRegister = async (req, res) => {
    try {

        res.render('./user/pages/register')
    } catch (error) {
        // console.log(error)
        throw new Error(error)
    }
}

// inserting User-- 
const insertUser = async (req, res) => {
    try {
        const emailCheck = req.body.email;
        const checkData = await User.findOne({ email: emailCheck });
        if (checkData) {
            return res.render('./user/pages/register', { userCheck: "User already exists, please try with a new email" });
        } else {
            const UserData = {
                userName: req.body.userName,
                email: req.body.email,
                password: req.body.password,
            };

            const OTP = generateOTP() /** otp generating **/

            req.session.otpUser = { ...UserData, otp: OTP };
            console.log(req.session.otpUser.otp)
            // req.session.mail = req.body.email;  

            // otp sending //
            try {
                sendOtp(req.body.email, OTP, req.body.userName);
                return res.redirect('/sendOTP');
            } catch (error) {
                console.error('Error sending OTP:', error);
                return res.status(500).send('Error sending OTP');
            }
        }

    } catch (error) {
        throw new Error(error);
    }
}



// loadSentOTP page Loding--
const sendOTPpage = asyncHandler(async (req, res) => {
    try {
        const email = req.session.otpUser.email
        res.render('./user/pages/verifyOTP', { email })
    } catch (error) {
        throw new Error(error)
    }

})

// verifyOTP route handler
const verifyOTP = asyncHandler(async (req, res) => {
    try {

        const enteredOTP = req.body.otp;
        const email = req.session.otpUser.email
        const storedOTP = req.session.otpUser.otp; // Getting the stored OTP from the session
        // console.log(storedOTP);
        const user = req.session.otpUser;

        if (enteredOTP == storedOTP) {
            const newUser = await User.create(user);

            delete req.session.otpUser.otp;

            res.redirect('/');

        } else {

            messages = 'Verification failed, please check the OTP or resend it.';
            console.log('verification failed');

        }
        res.render('./user/pages/verifyOTP', { messages, email })


    } catch (error) {
        throw new Error(error);
    }
});



// Resending OTP---
const reSendOTP = async (req, res) => {
    try {
        const OTP = generateOTP() /** otp generating **/
        req.session.otpUser.otp = { otp: OTP };


        const email = req.session.otpUser.email
        const userName = req.session.otpUser.userName


        // otp resending //
        try {
            sendOtp(email, OTP, userName);
            console.log('otp is sent');
            console.log(OTP)
            return res.render('./user/pages/reSendOTP', { email });
        } catch (error) {
            console.error('Error sending OTP:', error);
            return res.status(500).send('Error sending OTP');
        }

    } catch (error) {
        throw new Error(error)
    }
}

// verify resendOTP--
const verifyResendOTP = asyncHandler(async (req, res) => {
    try {
        const enteredOTP = req.body.otp;
        console.log(enteredOTP);
        const storedOTP = req.session.otpUser.otp;
        console.log(storedOTP);

        const user = req.session.otpUser;

        if (enteredOTP == storedOTP.otp) {
            console.log('inside verification');
            const newUser = await User.create(user);
            if (newUser) {
                console.log('new user insert in resend page', newUser);
            } else { console.log('error in insert user') }
            delete req.session.otpUser.otp;
            res.redirect('/');
        } else {
            console.log('verification failed');
        }
    } catch (error) {
        throw new Error(error);
    }
});


// loading login page---
const loadLogin = async (req, res) => {
    try {

        res.render('./user/pages/login');
    } catch (error) {
        throw new Error(error)
    }
}
// UserLogout----
const userLogout = async (req, res) => {
    try {
        req.logout(function (err) {

            if (err) {
                next(err);
            }
        })

        // req.user.id=null
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}


// loading shop page---
const loadShop = async (req, res) => {
    try {
       const getalldata = await Product.find().populate("categoryName")
    
        res.render('./user/pages/shop',{getalldata})
    } catch (error) {
        throw new Error(error)
    }
}
// loading about page---
const loadAbout = async (req, res) => {
    try {

        res.render('./user/pages/about')
    } catch (error) {
        throw new Error(error)
    }
}
// loading about page---
const loadContact = async (req, res) => {
    try {

        res.render('./user/pages/contact')
    } catch (error) {
        throw new Error(error)
    }
}
// loading My Account page---
const loadAccount = async (req, res) => {
    try {
const user=req.user;
console.log(user)
const messages = req.flash();
const wallet = await Wallet.findOne({ user: user._id });
        res.render('./user/pages/account',{user,wallet})
    } catch (error) {
        throw new Error(error)
    }
}


// loading My Product page---
const loadProduct = async (req, res) => {
    
    try {
        const id = req.query.id
        const user = req.user
        console.log(user)
        const reviews = await Review.find({ product: id }).populate("user");


        let totalRating = 0;
        let avgRating = 0;

        if (reviews.length > 0) {
            for (const review of reviews) {
                totalRating += Math.ceil(parseFloat(review.rating));
            }
            const averageRating = totalRating / reviews.length;
            avgRating = averageRating.toFixed(2);

        } else {
            avgRating = 0;
        }
        const getalldata = await Product.findOne({ _id: id })
        
       
        res.render('./user/pages/product', { getalldata: getalldata ,reviews, avgRating});
    } catch (error) {
        throw new Error(error)
    }

}


//loading wishlistPage---
const wishlistpage = async (req, res) => {

    try {

        const getWishlistData = await Wishlist.aggregate([

            {
                $lookup: {
                    from: 'products',
                    localField: 'productID',
                    foreignField: '_id',
                    as: 'productDetails',
                }
            }
        ]);


        if (!getWishlistData) {
            return res.status(400).json({ error: "Wishlist Data Fetch Failed" })
        }


        res.render('./user/pages/wishlist', { getWishlistData });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}


//add to wishlist--
const userWishlist_add = async (req, res) => {


    const userID = req.user.id
    const productID = req.params.productID;

    try {

        const checkAlredyexists = await Wishlist.findOne({ productID });

        if (checkAlredyexists) {
            return res.status(200).json({ exists: "Product Alredy Exists in the Wishlist" })
        }

        const getProduct = await Product.findById(productID);

        if (!getProduct) {
            return res.status(400).json({ error: "Wishlist Product Get Failed" });
        }

        const saveData = new Wishlist({
            userID: userID,
            productID: getProduct._id,
        });

        const wishlistAdd = await saveData.save();

        if (!wishlistAdd) {
            return res.status(400).json({ error: "Wishlist Product Add Failed" });
        }

        return res.status(200).json({ message: "Wishlist Product Add Successfull" })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }

}

// wishlist delete---
const wishlistDelete_get = async (req, res) => {

    const productID = req.params.productID;

    try {
        const getProduct = await Wishlist.findOneAndDelete(productID);

        if (!getProduct) {
            return res.status(400).json({ error: " Product Remove Failed" });
        }

        return res.status(200).json({ message: " Product Remove Successfull" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


//edit profile ---
async function editProfilePost(req, res) {
    // Get the user's current information.
    const userId =req.user.id;
    const user = await User.findOne({ _id: userId });

    // Get the user's updated information.
    const newuserName = req.body.userName;
    const newEmail = req.body.email;


    // Update the user's information.
    user.userName = newuserName;
    user.email = newEmail;
    await user.save();

    // Return a success response.
    req.flash("profile updated successfully", `Item Removed`);
    res.redirect('/account')
}



//change password---
const UpdatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);


        console.log('Provided Old Password:', oldPassword);

        // Compare the old password
        if (!oldPassword) {
            console.error('Old password not provided');
            return res.status(400).json({ error: 'Old password not provided' });
        }

        const isPasswordValid = await user.isPasswordMatched(oldPassword);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Old password is incorrect' });
        }

        // Hash and update the new password
        try {
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
            console.log(newPassword)
            user.password = hashedNewPassword;

        } catch (hashError) {
            console.error('Error hashing new password:', hashError);
            return res.status(500).json({ error: 'Error hashing new password' });
        }

        // Save the updated user
        await user.save();

        res.redirect('/account');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//reset password page---
const forgetLoad = async (req, res) => {
    try {
        res.render('./user/pages/forgetpsw')
    } catch (error) {
        throw new Error(error)
    }
}

//reset pswd postemail--
const forgetpswd = async (req, res) => {
    try {

        const email = req.body.email
        const user = await User.findOne({ email: email });
        if (user) {
            const randomString = randomstring.generate();
            const updateData = await User.updateOne({ email: email }, { $set: { token: randomString } })
            sendVerifymail(user.userName, user.email, randomString);
            res.render('./user/pages/forgetpsw', { message: "Please check your mail to reset your password" })
        } else {
            res.render('./user/pages/forgetpsw', { message: "user email is incorrect" })
        }

    } catch (error) {
        throw new Error(error)
    }
}

//forget pswd page get---
const forgetPswdload = async(req,res)=>{

    try {
        const token =req.query.token;        
        const tokenData = await User.findOne({token:token})
        if(tokenData){
            res.render('./user/pages/forget-password',{user_id :tokenData._id});

        }else{
            res.render('./user/pages/404',{message:"Token is invalid"})
        }
    } catch (error) {
        throw new Error(error)
    }
}

//forget pswd post--
const resetPswd = async(req,res)=>{

    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const secure_password = await securePassword(password);

       const updateData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:secure_password,token:''}})
       res.render('./user/pages/login',{message:'password reset successfully'})

    } catch (error) {
        throw new Error(error)
    }
}


//Review post----
const addReview = async(req,res)=>{
    try {
        const productId = req.params.id;
        const userId = req.user._id;

        const existingReview = await Review.findOne({ user: userId, product: productId });

        if (existingReview) {
            existingReview.review = req.body.review;
            existingReview.rating = req.body.rating;
            await existingReview.save();
        } else {
            const review = req.body.review;
            const rating = req.body.review; 
            const newReview = await Review.create({
                user: userId,
                product: productId,
                review: req.body.review,
                rating: req.body.rating,
           
            });
        }
        res.redirect("back")

      
    } catch (error) {
        throw new Error(error)
    }
}


const walletTransactionspage = asyncHandler(async (req, res) => {
    try {
        const walletId = req.query.id;
        const walletTransactions = await WalletTransaction.find({ wallet: walletId }).sort({ timestamp: -1 });
       
        // const walletTransactions = await WalletTransaction.find({ wallet: walletId }).sort({ timestamp: -1 });
        res.render("user/pages/walletTransaction", {
            title: "Wallet Transactions",
            page: "Wallet-Transactions",
            walletTransactions,
        });
    } catch (error) {
        throw new Error(error);
    }
});


module.exports = {
    loadLandingPage,
    loadRegister,
    loadLogin,
    loadShop,
    loadAbout,
    loadContact,
    loadAccount,
    insertUser,
    userLogout,
    verifyResendOTP,
    reSendOTP,
    verifyOTP,
    sendOTPpage,
    loadProduct,
    wishlistpage,
    userWishlist_add,
    wishlistDelete_get,
    editProfilePost,
    UpdatePassword,
    forgetLoad,
    forgetpswd,
    forgetPswdload,
    resetPswd,
    addReview,
    walletTransactionspage

}
