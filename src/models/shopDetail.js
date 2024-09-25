import { Schema,model } from "mongoose";

const shopSchema= Schema({  
    shopify_id :{
        type: String
    },
    shop :{
        type: String
    },
    accessToken :{
        type: String
    },
    name:{
        type: String
    },
    email:{
        type: String
    }
},{timestamps: true},{
    createdAt: {
        type: Date,
        default: Date.now(),
    }
});

const shopModel = model("shop",shopSchema);
export default shopModel;