import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Eye, EyeOff, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SendEmail } from '@/api/integrations';

export default function LoginCredentialsDialog({ isOpen, onClose, credentials, teamMemberName }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      }
      toast.success(`${type === 'email' ? 'Email' : 'Password'} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyAllCredentials = async () => {
    const credentialsText = `Login Credentials for ${teamMemberName}:
Email: ${credentials.email}
Temporary Password: ${credentials.temporaryPassword}

Please change your password after first login.`;
    
    try {
      await navigator.clipboard.writeText(credentialsText);
      toast.success('All credentials copied to clipboard');
    } catch (error) {
      console.error('Failed to copy credentials:', error);
      toast.error('Failed to copy credentials');
    }
  };

  const sendCredentialsEmail = async () => {
    setIsSendingEmail(true);
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your PhotoEvent Pro Account</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            .header {
              background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              font-weight: bold;
              margin: 0;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header p {
              color: #e2e8f0;
              font-size: 16px;
              margin: 10px 0 0 0;
            }
            .content {
              padding: 40px 30px;
            }
            .welcome {
              text-align: center;
              margin-bottom: 40px;
            }
            .welcome h2 {
              color: #1e293b;
              font-size: 24px;
              margin: 0 0 10px 0;
            }
            .welcome p {
              color: #64748b;
              font-size: 16px;
              margin: 0;
            }
            .credentials-box {
              background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
              position: relative;
            }
            .credentials-box::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(135deg, #8b5cf6 0%, #10b981 100%);
              border-radius: 12px 12px 0 0;
            }
            .credential-item {
              margin-bottom: 20px;
            }
            .credential-item:last-child {
              margin-bottom: 0;
            }
            .credential-label {
              color: #475569;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .credential-value {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 12px 16px;
              font-size: 16px;
              font-weight: 500;
              color: #1e293b;
              font-family: 'Courier New', monospace;
              word-break: break-all;
            }
            .warning-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 1px solid #f59e0b;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
              display: flex;
              align-items: start;
            }
            .warning-icon {
              color: #d97706;
              font-size: 20px;
              margin-right: 12px;
              margin-top: 2px;
            }
            .warning-content h3 {
              color: #92400e;
              font-size: 16px;
              font-weight: bold;
              margin: 0 0 8px 0;
            }
            .warning-content p {
              color: #a16207;
              font-size: 14px;
              margin: 0;
            }
            .action-button {
              display: inline-block;
              background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
              color: #ffffff;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.25);
              transition: all 0.3s ease;
            }
            .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              color: #64748b;
              font-size: 14px;
              margin: 0 0 10px 0;
            }
            .footer .company {
              color: #8b5cf6;
              font-weight: 600;
              font-size: 16px;
            }
            @media (max-width: 600px) {
              .container {
                margin: 10px;
                border-radius: 12px;
              }
              .header, .content, .footer {
                padding: 25px 20px;
              }
              .credentials-box {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📸 PhotoEvent Pro</h1>
              <p>Professional Event Management System</p>
            </div>
            
            <div class="content">
              <div class="welcome">
                <h2>Welcome to the Team, ${teamMemberName}! 🎉</h2>
                <p>Your PhotoEvent Pro account has been created and is ready to use.</p>
              </div>
              
              <div class="credentials-box">
                <div class="credential-item">
                  <div class="credential-label">Email Address</div>
                  <div class="credential-value">${credentials.email}</div>
                </div>
                <div class="credential-item">
                  <div class="credential-label">Temporary Password</div>
                  <div class="credential-value">${credentials.temporaryPassword}</div>
                </div>
              </div>
              
              <div class="warning-box">
                <div class="warning-icon">⚠️</div>
                <div class="warning-content">
                  <h3>Important Security Notice</h3>
                  <p>Please change this temporary password immediately after your first login for security purposes. This password should be kept confidential and not shared with anyone.</p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <p style="margin-bottom: 20px; color: #64748b;">Ready to get started? Click the button below to access your account:</p>
                <a href="${window.location.origin}" class="action-button">
                  Access PhotoEvent Pro 🚀
                </a>
              </div>
              
              <div style="background: #f1f5f9; border-radius: 12px; padding: 25px; margin-top: 30px;">
                <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0;">📋 Getting Started:</h3>
                <ol style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Visit the PhotoEvent Pro website</li>
                  <li style="margin-bottom: 8px;">Enter your email address and temporary password</li>
                  <li style="margin-bottom: 8px;">You'll be prompted to create a new secure password</li>
                  <li style="margin-bottom: 8px;">Explore your dashboard and start managing events!</li>
                </ol>
              </div>
            </div>
            
            <div class="footer">
              <p class="company">PhotoEvent Pro Team</p>
              <p>Professional photobooth event management made simple</p>
              <p style="font-size: 12px; color: #94a3b8;">If you have any questions, please don't hesitate to reach out to your administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await SendEmail({
        to: credentials.email,
        subject: `🎉 Welcome to PhotoEvent Pro - Your Account is Ready!`,
        body: emailHtml
      });

      toast.success(`Login credentials sent to ${credentials.email}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!credentials) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-700">Login Account Created!</DialogTitle>
          <DialogDescription>
            Login credentials have been generated for <strong>{teamMemberName}</strong>.
            You can copy them or send them directly via email.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 text-sm font-medium mb-2">
              <span>⚠️ Important Security Note</span>
            </div>
            <p className="text-yellow-700 text-sm">
              The user must change this temporary password on their first login. 
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="email"
                  value={credentials.email}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(credentials.email, 'email')}
                  className="shrink-0"
                >
                  {copiedEmail ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Temporary Password
              </Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.temporaryPassword}
                    readOnly
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(credentials.temporaryPassword, 'password')}
                  className="shrink-0"
                >
                  {copiedPassword ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button 
              onClick={sendCredentialsEmail} 
              disabled={isSendingEmail}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              {isSendingEmail ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Credentials via Email
                </>
              )}
            </Button>
            <Button onClick={copyAllCredentials} variant="outline" className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Copy All Credentials
            </Button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}