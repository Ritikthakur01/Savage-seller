import nodemailer from 'nodemailer';
import { config } from '../utils/config';

const { mail_email , mail_password } = config

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: mail_email,
      pass: mail_password,
    },
});

export default transporter