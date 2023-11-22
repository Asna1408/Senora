const Banner = require("../models/BannerModel");
const asyncHandler = require("express-async-handler");
const Category = require("../models/categoryModel");
const mongoose = require("mongoose");


const { newformatDate } = require('../helpers/dateFormat');


const banner_get = async (req, res) => {

    try {

        const allBanner = await Banner.find();

        allBanner.forEach((item) => {
            item.startDate = newformatDate(item.startDate)

            item.endDate = newformatDate(item.endDate)

            item.createdDate = newformatDate(item.startDate)

        });

        if (allBanner) {
            return res.render('./admin/pages/bannerList', { allBanner ,title:"Banner"});
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json("Internal Server Error")
    }
}


const newBanner_get = (req, res) => {
    res.render('./admin/pages/addBanner',{title:"addBanner"});
} 
            
 
              




const newBanner_post = async (req, res) => {

    console.log("Inside New Banner Post");

    try {
        const { banner_title, banner_url, banner_link, banner_position, banner_category, banner_status, start_date, end_date } = req.body;

        const bannerImages = req.files;
        
        console.log(req.files.bannerImage)

        //here it only takes second postion image(which is the cropped image )
        const bannerImageNames = bannerImages ? bannerImages.bannerImage[0].filename : "";

        const newBanner = new Banner({
            title: banner_title,
            imageUrl: banner_url,
            linkUrl: banner_link,
            bannerImage: bannerImageNames,
            position: banner_position,
            category: banner_category,
            status: banner_status,
            startDate: start_date,
            endDate: end_date,
            createdDate: start_date,
        });

        const savedProduct = await newBanner.save();

        if (savedProduct) {
            return res.redirect('/admin/banner')
       
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error:error.message });
    }
}




const bannerEdit_get = async (req, res) => {
    const bannerId = req.params.bannerId;

    try {
        const getBanner = await Banner.findById(bannerId);

        if (getBanner) {
            console.log(getBanner);
            res.render('./admin/pages/editBanner', { getBanner,title:"edit Banner" });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


const bannerEdit_post = async (req, res) => {

    const bannerId = req.body.bannerId;
    const {
        banner_title,
        banner_url,
        banner_link,
        banner_position,
        banner_category,
        banner_status,
        end_date,
    } = req.body;

    const bannerImage = req.files['bannerImage'];
    const bannerImageNames = bannerImage && bannerImage.length >= 2 ? [bannerImage[1].filename] : [];

    try {
        const updateFields = {
            title: banner_title,
            imageUrl: banner_url,
            linkUrl: banner_link,
            position: banner_position,
            category: banner_category,
        };

        //It adds only when banner image is provided
        if (bannerImage) {
            updateFields.bannerImage = bannerImageNames[0];
        }

        if (banner_status != 'None') {
            updateFields.status = banner_status;
        }

        if (end_date) {
            updateFields.endDate = end_date;
        }

        const getBanner = await Banner.findByIdAndUpdate(bannerId, { $set: updateFields }, { new: true });

        if (getBanner) {
            return res.redirect('/admin/banner')
       
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


const bannerDelete_get = async (req, res) => {


    try {
        const id = req.params.id;
        console.log("Banner id",id);
        const getBanner = await Banner.findOneAndDelete({_id:id});
        
        if (!getBanner) {
            return res.status(400).json({ message: "Banner Delete Failed" });
        }
       res.redirect('/admin/banner')
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: "Intenal Server Error" });
    }
}





module.exports = {
    newBanner_get,
    banner_get ,
    newBanner_post,
    bannerEdit_get,
    bannerEdit_post,
    bannerDelete_get
};