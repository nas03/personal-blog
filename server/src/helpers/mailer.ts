import logger from "@/helpers/logger";
import dotenv from "dotenv";
import nodemailer, { SendMailOptions } from "nodemailer";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  from: "sonanhnguyen003@gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const sendMail = async (payload: Omit<SendMailOptions, "from">) => {
  try {
    const info = await transporter.sendMail({
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      ...payload,
    });
    return info;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

const mailer = {
  sendMail,
};

export default mailer;
