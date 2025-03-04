// lib/auth.ts
import { supabase } from './supabase';
// import { v4 as uuidv4 } from 'uuid';
// import nodemailer from 'nodemailer';

// Configure email transporter (example using Gmail)
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD,
//     },
// });

export async function generateVerificationToken(userId: string): Promise<string> {
    // const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Store the token in the database
    const { error } = await supabase
        .from('verification_tokens')
        .insert({
            user_id: userId,
            // token,
            type: 'email_verification',
            expires_at: expiresAt.toISOString(),
        });

    if (error) throw error;

    return userId;
}

export async function sendVerificationEmail() { }

// export async function sendVerificationEmail(email: string, token: string): Promise<void> {
//     const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Verify Your Email Address',
//         html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px;">
//         <h2>Verify Your Email Address</h2>
//         <p>Thank you for signing up! Please click the button below to verify your email address:</p>
//         <a 
//           href="${verificationUrl}" 
//           style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;"
//         >
//           Verify Email
//         </a>
//         <p>Or copy and paste this link into your browser:</p>
//         <p>${verificationUrl}</p>
//         <p>This link will expire in 24 hours.</p>
//         <p>If you didn't create an account, you can safely ignore this email.</p>
//       </div>
//     `,
//     };

//     return new Promise((resolve, reject) => {
//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 reject(error);
//             } else {
//                 resolve();
//             }
//         });
//     });
// }