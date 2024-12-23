import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import { logger } from "@/logger/winston.logger";

export type SendEmailOptions = {
    email: string;
    subject: string;
    productName: string;
    productLink: string;
    mailgenContent: Mailgen.Content;
}


/**
 * Sends an email using nodemailer and Mailgen.
 * 
 * @param {SendEmailOptions} options - The options containing email, subject, and mailgen content.
 */
const sendEmail = async (options: SendEmailOptions) => {
    // Initialize Mailgen instance with default theme and brand configuration
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: options.productName,
            link: options.productLink
        },
    });

    // Generate the plaintext version of the email (for clients that do not support HTML)
    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

    // Generate an HTML email with the provided contents
    const emailHtml = mailGenerator.generate(options.mailgenContent);

    // Create a nodemailer transporter instance which is responsible for sending the email
    const transporter = nodemailer.createTransport({
        service: process.env.NODEMAILER_SMPT_SERVICE,
        host: process.env.NODEMAILER_SMPT_HOST,
        port: Number(process.env.NODEMAILER_SMPT_PORT),
        secure: process.env.NODE_ENV === "production", // Use secure connection in production
        auth: {
            user: process.env.NODEMAILER_SMPT_AUTH_USER,
            pass: process.env.NODEMAILER_SMPT_AUTH_PASS
        }
    });

    // Compose the email details
    const mail = {
        from: "Social Backend API", // Sender's name
        to: options.email, // Receiver's email
        subject: options.subject, // Email subject
        text: emailTextual, // Plaintext version of the email
        html: emailHtml, // HTML version of the email
    };

    try {
        // Send the email
        await transporter.sendMail(mail);
    } catch (error) {
        // Log the error and fail silently since email sending is not critical to the business logic
        logger.error(
            "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
        );
        logger.error("Error: ", error);
    }
};

/**
 * Generates a mailgen content for an email verification email.
 *
 * @param username The username of the user to greet in the email
 * @param verificationUrl The link to the email verification route
 * @returns The mailgen content for the email verification email
 */
const emailVerificationMailgenContent = (username: string, verificationUrl: string): Mailgen.Content => {
    return {
        body: {
            name: username,
            intro: "Welcome ! We're very excited to have you on board.",
            action: {
                instructions:
                    "To verify your email please click on the following button:",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Verify your email",
                    link: verificationUrl,
                },
            },
            outro:
                "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};


/**
 * Generates a mailgen content for a password reset email.
 *
 * @param username The username of the user to greet in the email.
 * @param passwordResetUrl The link to the password reset route.
 * @returns The mailgen content for the password reset email.
 */

const forgotPasswordMailgenContent = (username: string, passwordResetUrl: string): Mailgen.Content => {
    return {
        body: {
            name: username,
            intro: "We got a request to reset the password of our account",
            action: {
                instructions:
                    "To reset your password click on the following button or link:",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Reset password",
                    link: passwordResetUrl,
                },
            },
            outro:
                "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

export {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
};