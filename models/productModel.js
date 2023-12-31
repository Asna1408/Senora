const mongoose = require('mongoose');

var ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, 
    },
    description: {
        type: String,
        required: true,
        
    },
    brand:{
        type:String,
        required:true,
    },
    color: {
        type: String,
        required:true 
    },
    size:{
        type:Number,
        required:true,
    },
    productPrice: { 
        type: Number,
        required: true
    },
    salePrice: { 
        type: Number, 
        required: true
    },
    categoryName:{  
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'Category' 
        type: String,
        required: true, 
    },
    
    quantity: {
        type: Number,
        required: true
    },
    sold: {     
        type: Number,
        default: 0
    },
    primaryImage:[{
        name:{
            type:String, 
            required:true
        },
        path:{
            type:String, 
            required:true
        } 
    }], 
    secondaryImages:[{
        name:{
            type:String,
            required:true, 
        },
        path:{
            type:String,
            required:true, 
        }
    }],
       ratings: [{ 
        star: Number,
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    isListed:{
        type:Boolean,
        default:true
    },
    
}, { timestamps: true });

// Export the model
module.exports = mongoose.model('Product', ProductSchema);