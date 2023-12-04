const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const expressHandler = require('express-async-handler')
const sharp = require('sharp')
const path = require('path')
const mongoose = require('mongoose')


// productManagement--
const productManagement = expressHandler(async (req, res) => {
    try {
        const findProduct = await Product.find().populate('categoryName');
        res.render('./admin/pages/product', { title: 'Products', productList: findProduct })
    } catch (error) {
        throw new Error(error)
    }
})

// addProduct Page---
const addProduct = expressHandler(async (req, res) => {
    try {
        const category = await Category.find({ isListed: true })
        if (category) {
            res.render('./admin/pages/addProduct', { title: 'addProduct', catList: category })
        }
    } catch (error) {
        throw new Error(error)
    }
})

// inserting a product--- 
const insertProduct = expressHandler(async (req, res) => {
    
    try {

        let primaryImage = []
        req.files.primaryImage.forEach((e) => {
            primaryImage.push({
                name: e.filename,
                path: e.path
            })
        });
        


        const secondaryImages = [];      /* Secondary images cropping area */
        for (const e of req.files.secondaryImage) {
            const croppedImage = path.join(__dirname, '../public/admin/uploads', `cropped_${e.filename}`);

            await sharp(e.path)
                .resize({ fit: "cover" })
                .toFile(croppedImage);

            secondaryImages.push({
                name: `cropped_${e.filename}`,
                path: croppedImage,
            });
        }



        const saving = new Product({
            title: req.body.title,
            brand: req.body.brand,
            color: req.body.color,
            size:req.body.size,
            description: req.body.description,
            categoryName: req.body.categoryName,
            quantity: req.body.quantity,
            productPrice: req.body.productPrice,
            salePrice: req.body.salePrice,
            primaryImage: primaryImage,
            secondaryImages: secondaryImages,
        })

        const inserted = await saving.save()
 
        if (inserted) {

             return res.redirect('/admin/product');
        }
    } catch (error) {
        throw new Error(error)
    }
})

// ListProduct---
const listProduct = expressHandler(async (req, res) => {
    try {

        const id = req.params.id
        console.log(id);

        const listing = await Product.findByIdAndUpdate({ _id: id }, { $set: { isListed: true } })
       
        res.redirect('/admin/product')

    } catch (error) {
        throw new Error(error)
    }
})

// unlist category---
const unListProduct = expressHandler(async (req, res) => {
    try {
        const id = req.params.id
        const listing = await Product.findByIdAndUpdate({ _id: id }, { $set: { isListed: false } })
        res.redirect('/admin/product')

    } catch (error) {
        throw new Error(error)
    }

})

// editProductPage Loading---
const editProductPage = expressHandler(async (req, res) => {
    try {
        const id = req.params.id

        const category = await Category.find({ isListed: true })
        const productFound = await Product.findById(id).populate('categoryName').exec()
     

        
       
        if (productFound) {
            res.render('./admin/pages/editProduct', { title: 'editProduct', product: productFound, catList: category })
        }

    } catch (error) {
        throw new Error(error)
    }
})


const updateProduct = expressHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const existingProduct = await Product.findById(id);
      
        // Handle primary image
        let primaryImage;
        if (req.files.primaryImage) {
            const primaryImageFile = req.files.primaryImage[0];
            primaryImage = {
                name: primaryImageFile.filename,
                path: primaryImageFile.path,
            };
        } else {
            // No new primary image uploaded, retain the existing one
            primaryImage = existingProduct.primaryImage[0]; 
        }

        // Handle secondary images
        const secondaryImageIDs = req.body.idSecondaryImage; /* hidden input image id */
        const secondaryImages = req.files.secondaryImage;
        const dbImage = [];
        if (secondaryImages) {
            
            existingProduct.secondaryImages.forEach((image)=>{
               dbImage.push({
                name:image.name,
                path:image.path
               })
            })
            secondaryImages.forEach((image)=>{
               dbImage.push({
                name:image.filename,
                path:image.path
               })
            })
           
        }

        // Save the updated product back to the database
        existingProduct.primaryImage = [primaryImage];
   

        await existingProduct.save(); // Assuming you are using Mongoose



        const editingProduct = {
            title: req.body.title,
            description: req.body.description,
            brand: req.body.brand,
            color: req.body.color,
            size:req.body.size,
            categoryName: req.body.categoryName,
            quantity: req.body.quantity,
            productPrice: req.body.productPrice,
            salePrice: req.body.salePrice,
            primaryImage: [primaryImage] ,// Include other fields you want to update
            secondaryImages :dbImage
        };

        const updatedProduct = await Product.findByIdAndUpdate(id, editingProduct, { new: true });
        console.log('updated product', updatedProduct);

        res.redirect('/admin/product');


    } catch (error) {
        throw new Error(error)
    }  
}) 




const deleteImage =  expressHandler(async(req, res) => {
    let secondaryImages = await Product.findOne({ _id: req.params.productId }, { _id: 0, secondaryImages: 1 })
    let secondImages = secondaryImages.secondaryImages
    let imageToDelete = req.params.imageName

    const updatedImages = secondImages.filter(
        (image) => image.name !== imageToDelete
    );

    await Product.updateOne({ _id: req.params.productId }, { $set: { secondaryImages: updatedImages } })
        .then(() => res.redirect('back'))
        .catch((err) => {
            console.log(err).send("image deleted")
            res.status(400).send("invalid request")
        })
})


    

module.exports = {
    addProduct,
    insertProduct,
    productManagement,
    listProduct,
    unListProduct,
    editProductPage,
    updateProduct,
    deleteImage
 
   
} 

