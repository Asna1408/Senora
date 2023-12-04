const mongoose = require('mongoose')

const schedule = require("node-schedule")
const { findByIdAndUpdate } = require('../models/usermodel');
const { findOneAndUpdate } = require('../models/walletTransactionModel');
const Product = require('../models/productModel')

const Schema = mongoose.Schema;
const categorySchema = new Schema({
    
    categoryName:{
        type:String,
        required:true
        
    },
    
    isListed:{ 
        type:Boolean,
        default:true
    },
    offer: Number,
   
    startDate: Date,
    endDate: Date,

},{timestamps:true});



categorySchema.pre("save", async function (next) {
    try {
        await updateProductPrices(this);
        next();
    } catch (error) {
        console.error("Error in pre-save middleware:", error);
        next(error);
    }
});


async function updateProductPrices(category) {
    const products = await Product.find({ categoryName: category._id });
    const currentDate = new Date();
    if (category.offer && category.offer > 1 && category.startDate <= currentDate && currentDate <= category.endDate) {
        for (const product of products) {
            const newPrice = product.productPrice - (product.productPrice * category.offer) / 100;
            product.salePrice = Math.round(newPrice);
            await product.save();
        }
    } else {
        for (const product of products) {
            product.salePrice = product.productPrice;
            await product.save();
        }
    }
}

const dailyScheduleRule = new schedule.RecurrenceRule();
dailyScheduleRule.hour = 0;
dailyScheduleRule.minute = 0;

schedule.scheduleJob(dailyScheduleRule, async () => {
    const categories = await category.find();

    for (const category of categories) {
        await updateProductPrices(category);
    }
});

//Export the model
module.exports = mongoose.model('Category', categorySchema);