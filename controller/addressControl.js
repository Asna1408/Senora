const { default: mongoose } = require('mongoose')
const Address = require('../models/addressModel')
const User = require('../models/usermodel')
const asyncHandler = require('express-async-handler')


// saved Addresses--
const savedAddress = asyncHandler(async (req, res) => {
    try {
        const user = req.user
        const userWithAddresses = await User.findById(user).populate('addresses');
        const address = userWithAddresses.addresses
        res.render('./user/pages/savedAddress', { address })
    } catch (error) {
        throw new Error(error)
    }
})

// loading address page---
const addAddressPage = asyncHandler(async (req, res) => {
    try {
        res.render('./user/pages/addAddress')
    } catch (error) {
        throw new Error(error)
    }
})

// insert-Address
const insertAddress = asyncHandler(async (req, res) => {
    try {
        console.log('body', req.body);
        const user = req.user;
        const address = await Address.create(req.body); // Inserting Address
        user.addresses.push(address._id); //pushing the added address
        await user.save(); //save the user 
        console.log(address);
        res.redirect('/savedAddress')
    } catch (error) {
        throw new Error(error)
    }
})



// editAddressPage laoding
const editData = async (req, res) => {
    try {
 
        const Data = await Address.findById(req.query.id)
       
        res.render('./user/pages/editAddres', { Data })
    } catch (error) {
        throw error
    }
}


// updateAddress Post
const updateAddress = asyncHandler(async (req, res) => {

    try {
        const id = new mongoose.Types.ObjectId(req.body.userId)
        console.log(id)

        const saveData = {
            name: req.body.name,
            address: req.body.address,
            town: req.body.city,
            state: req.body.state,
            postCode: req.body.pincode,
            phone: req.body.mobile
        }
        const save = await Address.findByIdAndUpdate({ _id: id }, { $set: saveData }, { new: true })


        if (!save) {

            return res.status(404).json({ error: "Update failed" })

        } else {
            return res.status(200).json({ message: "data updated succesfully" })
        }
    } catch (error) {
        throw new Error(error)
    }
})


// DeleteAddress
const deleteAddress = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id
        const deleteAddress = await Address.findOneAndDelete({ _id: id });
        res.redirect('/savedAddress')


    } catch (error) {
        throw new Error(error)
    }
})


module.exports = {
    addAddressPage,
    insertAddress,
    savedAddress,
    updateAddress,
    deleteAddress,
    editData

}