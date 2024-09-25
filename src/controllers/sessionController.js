import shopModel from "../models/shopDetail";
import { createError } from "../utils/constants/createError";
import axios from "axios";

export const addSession =async (req, res, next)=>{
    try{

        const { accessToken, shop } = req.body;

        if((!accessToken || accessToken == "") || (!shop || shop == "")){
            throw createError(400,"Missing parameter");
        };

        let isShopExist = await shopModel.findOne({shop});

        if(isShopExist){
            return next(createError(400,"Session is already exists for provided shop name."))
        }

        const apiUrl = `https://${shop}/admin/api/2024-04/shop.json`;

        const shopResponse = await axios.get(apiUrl, {
            headers: {
                'X-Shopify-Access-Token': accessToken
            }
        })
        
        const addSession = await shopModel.create({
            shopify_id : shopResponse.data.shop.id,
            accessToken,
            shop,
            name : shopResponse.data.shop.name,
            email : shopResponse.data.shop.email
        })

        if(!addSession){
            return next(createError(401,"Fail to add session"))
        }

        return res.status(200).json({
            success : true,
            message : "Session added successfully.",
            data: addSession
        })

    }catch(err){
        console.log("Errr",err)
        return next(createError(500,"Internal Server Error."));
    }
}

export const removeSession =async (req, res, next)=>{
    try{

        const { shop } = req.body;

        if(!shop || shop == ""){
            throw createError(400,"Missing parameter");
        };

        let deleteSession = await shopModel.deleteOne({shop});

        if(!deleteSession){
            return next(createError(400,"Fail to delete Session."))
        }

        return res.status(200).json({
            success : true,
            message : "Session Deleted successfully.",
            data: deleteSession
        })

    }catch(err){
        return next(createError(500,"Internal Server Error."));
    }
}