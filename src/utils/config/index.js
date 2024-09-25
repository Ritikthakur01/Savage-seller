import dotenv from "dotenv";
dotenv.config();

export const config = {
  mongodburl: process.env.MONGO_URL || "mongodb+srv://ensshopifyapps:smartloyality@cluster0.ppi5uw6.mongodb.net/SwaggerSellerApp?retryWrites=true&w=majority&appName=Cluster0",
  port:process.env.PORT || 9091,
  mail_email: process.env.MAIL_EMAIL || 'ritik.bhadauria@ens.enterprises',
  mail_password: process.env.MAIL_PASSWORD || "wnxv jtnp gjbg wskj",
  secret_key : process.env.SECRET_KEY || "fdsbdsbsdffsdfdsfgnrkrensf83dsfds"
};