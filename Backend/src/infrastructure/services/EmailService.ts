import { injectable, inject } from 'inversify';
import nodemailer, { Transporter } from 'nodemailer';
import { ILogger } from '@application/interfaces/IPasswordService';

export interface IEmailService {
  sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean>;
  sendEmailVerification(email: string, verificationToken: string, userName: string): Promise<boolean>;
  sendWelcomeEmail(email: string, userName: string): Promise<boolean>;
}

@injectable()
export class EmailService implements IEmailService {
  private transporter: Transporter;

  constructor(@inject('ILogger') private readonly logger: ILogger) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  public async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Manufacturing ERP',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER || '',
        },
        to: email,
        subject: 'Password Reset Request - Manufacturing ERP',
        html: this.getPasswordResetTemplate(userName, resetUrl),
        text: `Hi ${userName},\n\nYou requested a password reset for your Manufacturing ERP account.\n\nClick the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nManufacturing ERP Team`,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Password reset email sent successfully', {
        email,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send password reset email', error as Error, { email });
      return false;
    }
  }

  public async sendEmailVerification(email: string, verificationToken: string, userName: string): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Manufacturing ERP',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER || '',
        },
        to: email,
        subject: 'Verify Your Email Address - Manufacturing ERP',
        html: this.getEmailVerificationTemplate(userName, verificationUrl),
        text: `Hi ${userName},\n\nWelcome to Manufacturing ERP!\n\nPlease verify your email address by clicking the following link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create this account, please ignore this email.\n\nBest regards,\nManufacturing ERP Team`,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Email verification sent successfully', {
        email,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send email verification', error as Error, { email });
      return false;
    }
  }

  public async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    try {
      const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
      
      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Manufacturing ERP',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER || '',
        },
        to: email,
        subject: 'Welcome to Manufacturing ERP!',
        html: this.getWelcomeTemplate(userName, dashboardUrl),
        text: `Hi ${userName},\n\nWelcome to Manufacturing ERP!\n\nYour account has been successfully created and verified.\n\nYou can now access your dashboard at:\n${dashboardUrl}\n\nBest regards,\nManufacturing ERP Team`,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Welcome email sent successfully', {
        email,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send welcome email', error as Error, { email });
      return false;
    }
  }

  private getPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Manufacturing ERP</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 20px; font-size: 14px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Manufacturing ERP</h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${userName},</p>
            <p>You requested a password reset for your Manufacturing ERP account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <div class="footer">
                <p><strong>Important:</strong> This link will expire in 1 hour.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p>Best regards,<br>Manufacturing ERP Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getEmailVerificationTemplate(userName: string, verificationUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Manufacturing ERP</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 20px; font-size: 14px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to Manufacturing ERP!</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi ${userName},</p>
            <p>Welcome to Manufacturing ERP! Please verify your email address to complete your registration.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <div class="footer">
                <p><strong>Important:</strong> This link will expire in 24 hours.</p>
                <p>If you didn't create this account, please ignore this email.</p>
                <p>Best regards,<br>Manufacturing ERP Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getWelcomeTemplate(userName: string, dashboardUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Manufacturing ERP!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 20px; font-size: 14px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to Manufacturing ERP!</h1>
        </div>
        <div class="content">
            <h2>Account Successfully Created</h2>
            <p>Hi ${userName},</p>
            <p>Welcome to Manufacturing ERP! Your account has been successfully created and verified.</p>
            <p>You can now access your dashboard and start managing your manufacturing operations:</p>
            <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            <p>Or visit: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
            <div class="footer">
                <p>Thank you for choosing Manufacturing ERP!</p>
                <p>Best regards,<br>Manufacturing ERP Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}