import { Resend } from "resend";

export class EmailService {
  private static getClient(): Resend | null {
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("your-key")) {
      return new Resend(process.env.RESEND_API_KEY);
    }
    return null;
  }

  private static fromAddress(): string {
    return process.env.EMAIL_FROM || "LaunchPilot <notifications@launchpilot.dev>";
  }

  private static siteUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  /**
   * 1. Welcome Email (on signup or first submission)
   */
  static async sendWelcomeEmail(to: string, name: string) {
    const client = this.getClient();
    const appUrl = this.siteUrl();
    const subject = "Welcome to LaunchPilot — Let's get your product seen 🚀";
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background-color: #0b0f19; color: #f3f4f6; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 28px; letter-spacing: -0.5px;">LaunchPilot</h1>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 4px;">Distribution engine for indie hackers</p>
        </div>
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Welcome aboard, ${name}! 👋</h2>
          <p style="color: #d1d5db; line-height: 1.6;">You shipped your product — now let's make sure the world actually sees it. LaunchPilot analyzes your product across 35 directories and communities, generates tone-matched copy, and gives you an execution-ready launch plan.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${appUrl}/dashboard" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Go to Your Dashboard</a>
          </div>
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">Next steps:<br/>1. Complete or view your product analysis<br/>2. Review the tailored copy for Product Hunt, Hacker News, and Reddit<br/>3. Start submitting or upgrade to have our team do it for you</p>
        </div>
        <p style="text-align: center; font-size: 12px; color: #6b7280;">LaunchPilot Inc. • Built for indie devs</p>
      </div>
    `;

    if (!client) {
      console.log(`[Email Mock] Sent Welcome Email to ${to}`);
      return { id: "mock-email-welcome" };
    }

    return client.emails.send({
      from: this.fromAddress(),
      to,
      subject,
      html,
    });
  }

  /**
   * 2. Analysis Ready Email
   */
  static async sendAnalysisReadyEmail(to: string, name: string, productName: string, productId: string) {
    const client = this.getClient();
    const appUrl = this.siteUrl();
    const reportUrl = `${appUrl}/product/${productId}`;
    const subject = `Your Launch Report for ${productName} is ready! 🎯`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background-color: #0b0f19; color: #f3f4f6; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 28px;">LaunchPilot</h1>
        </div>
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Analysis Complete for ${productName}! 🚀</h2>
          <p style="color: #d1d5db; line-height: 1.6;">Hi ${name}, our AI has evaluated ${productName} across 35 launch platforms and directories. We've scored audience fit, identified the top high-intent channels, and drafted custom launch copy for each.</p>
          <div style="background-color: #1e1b4b; border: 1px solid #3730a3; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #c7d2fe; font-size: 14px; font-weight: 500;">✨ Highlights in your report:</p>
            <ul style="color: #e0e7ff; font-size: 13px; margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6;">
              <li>Top 20 platform match scores and rationale</li>
              <li>Tone-matched listings respecting character limits</li>
              <li>Big Launch Kit for Product Hunt, Hacker News, and Reddit</li>
              <li>Interactive distribution tracker with custom UTM links</li>
            </ul>
          </div>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${reportUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Launch Report</a>
          </div>
        </div>
        <p style="text-align: center; font-size: 12px; color: #6b7280;">LaunchPilot Inc. • Built for indie devs</p>
      </div>
    `;

    if (!client) {
      console.log(`[Email Mock] Sent Analysis Ready Email to ${to} for ${productName}`);
      return { id: "mock-email-analysis" };
    }

    return client.emails.send({
      from: this.fromAddress(),
      to,
      subject,
      html,
    });
  }

  /**
   * 3. Payment Receipt Email
   */
  static async sendPaymentReceiptEmail(
    to: string,
    name: string,
    productName: string,
    plan: string,
    amount: number,
    currency: string
  ) {
    const client = this.getClient();
    const appUrl = this.siteUrl();
    const planDisplay = plan === "done_for_you" ? "Done-For-You Package" : plan === "launch_kit" ? "Launch Kit" : "Growth Subscription";
    const subject = `Receipt for your LaunchPilot purchase: ${planDisplay} 🧾`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background-color: #0b0f19; color: #f3f4f6; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 28px;">LaunchPilot</h1>
        </div>
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Payment Confirmed! 🎉</h2>
          <p style="color: #d1d5db; line-height: 1.6;">Thank you, ${name}. Your order has been processed successfully.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 10px 0; color: #9ca3af;">Product</td>
              <td style="padding: 10px 0; color: #ffffff; text-align: right; font-weight: 500;">${productName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 10px 0; color: #9ca3af;">Plan</td>
              <td style="padding: 10px 0; color: #ffffff; text-align: right; font-weight: 500;">${planDisplay}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 10px 0; color: #9ca3af;">Total Paid</td>
              <td style="padding: 10px 0; color: #10b981; text-align: right; font-weight: 700;">${currency === "INR" ? "₹" : "$"}${amount}</td>
            </tr>
          </table>
          ${
            plan === "done_for_you"
              ? `<div style="background-color: #064e3b; border: 1px solid #059669; border-radius: 6px; padding: 14px; margin-top: 20px;">
                  <p style="margin: 0; color: #a7f3d0; font-size: 13px;">Our submission specialists will review your assets and begin manual submissions to eligible platforms within 24 hours. You can follow live progress in your tracker!</p>
                </div>`
              : ""
          }
          <div style="margin: 28px 0; text-align: center;">
            <a href="${appUrl}/dashboard" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Open Dashboard</a>
          </div>
        </div>
      </div>
    `;

    if (!client) {
      console.log(`[Email Mock] Sent Payment Receipt to ${to} (${planDisplay} - ${currency} ${amount})`);
      return { id: "mock-email-receipt" };
    }

    return client.emails.send({
      from: this.fromAddress(),
      to,
      subject,
      html,
    });
  }

  /**
   * 4. Launch Complete Email
   */
  static async sendLaunchCompleteEmail(to: string, name: string, productName: string, liveCount: number) {
    const client = this.getClient();
    const appUrl = this.siteUrl();
    const subject = `Your Launch Submissions are Complete for ${productName}! 🏆`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background-color: #0b0f19; color: #f3f4f6; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 28px;">LaunchPilot</h1>
        </div>
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Congratulations on Launching ${productName}! 🎉</h2>
          <p style="color: #d1d5db; line-height: 1.6;">Hi ${name}, all target platform submissions for ${productName} have been executed. We have verified ${liveCount} listings and recorded all direct proof links and live URLs in your tracker.</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${appUrl}/dashboard" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Live Tracker & Proofs</a>
          </div>
        </div>
        <p style="text-align: center; font-size: 12px; color: #6b7280;">LaunchPilot Inc. • Built for indie devs</p>
      </div>
    `;

    if (!client) {
      console.log(`[Email Mock] Sent Launch Complete Email to ${to} for ${productName}`);
      return { id: "mock-email-complete" };
    }

    return client.emails.send({
      from: this.fromAddress(),
      to,
      subject,
      html,
    });
  }
}
