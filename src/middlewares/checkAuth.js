import { createError } from '../utils/constants/createError.js';
import shopModel from '../models/shopDetail.js';

export const checkAuth = async (req, res, next) => {
    try {

        const { shop } = req.body.shop ? req.body : req.query;

        if (!shop) {
            res.status(400).json({
                success: false,
                message: "Shop data doesn't found.",
                error: error.message,
              });
        }

        const getShop = await shopModel.findOne({shop}).lean()

        if ( getShop && Object.keys(getShop).length > 0) {

            const { accessToken } = getShop;

            req.shopifyAccessToken = accessToken;
            req.shopId = getShop._id;

            next()

        }else{
            return res.status(400).json({
                success: false,
                message: "Shop data not found...!",
            });
        }

    } catch (error) {
        console.log("Error to validate shopify access token", error);
        return res.status(500).json({
            success: false,
            message: "Error to validate shopify access token."
        });
    }
};







