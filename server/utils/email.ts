import { Resend } from 'resend'

let resendInstance: Resend | null = null

// Lazy initialization - only create when needed
function getResend() {
  if (!resendInstance) {
    const apiKey = process.env.EMAIL_HOST_PASSWORD
    if (!apiKey) {
      throw new Error('EMAIL_HOST_PASSWORD environment variable is not set')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

interface EmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    // Use Resend test email in development if domain not verified
    const fromEmail = process.env.EMAIL_FROM || 'Mortality Watch <onboarding@resend.dev>'

    console.log(`[Email] Sending to: ${to}`)
    console.log(`[Email] From: ${fromEmail}`)
    console.log(`[Email] Subject: ${subject}`)

    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html
    })

    if (error) {
      console.error('[Email] Sending failed:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to send email: ${error.message || JSON.stringify(error)}`)
    }

    console.log('[Email] Sent successfully:', data)
    return data
  } catch (error) {
    console.error('[Email] Error:', error)
    throw error
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/verify-email/${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h1>
          <p style="margin: 0 0 20px 0; color: #666;">Thank you for signing up for Mortality Watch! Please verify your email address by clicking the button below.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">Verify Email Address</a>
          </div>
          <p style="margin: 20px 0 0 0; color: #999; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
        </div>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create an account with Mortality Watch, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Verify your Mortality Watch email address',
    html
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password/${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h1>
          <p style="margin: 0 0 20px 0; color: #666;">We received a request to reset your password. Click the button below to choose a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">Reset Password</a>
          </div>
          <p style="margin: 20px 0 0 0; color: #999; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
        </div>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This reset link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Reset your Mortality Watch password',
    html
  })
}
