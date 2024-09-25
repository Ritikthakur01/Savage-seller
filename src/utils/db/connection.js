import {mongoose} from "mongoose";
import { config } from "../../utils/config";
mongoose.set('strictQuery', false)
const { mongodburl } = config;
const connectDb = async ()=>{
    try {
        mongoose.connect(mongodburl);
        console.log("DB is connected!");
    } catch (error) {
        console.log("db  is not conneted !");
    }
}
export default connectDb;