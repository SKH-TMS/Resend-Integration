# Resend-Integration
## Version 0

### Starting with the Resend

Resend is an email sending platform and API designed for developers. It's a service that handles the infrastructure and complexity of actually delivering emails reliably to recipients' inboxes.

we can install it in our project by following commad

#### Setup

1.  **Install Dependencies:**

    ```bash
    npm install resend
    ```

2.  **Environment Variables:**
    Create a `.env.local` file in your project root and add your Resend API key:
    ```.env
    RESEND_API_KEY=re_YOUR_API_KEY
    ```
    _Never commit your API key directly into your code or version control._

#### Documentation of Resend

Integration of Resend with the Nextjs
[ResendDocumentation](https://resend.com/docs/send-with-nextjs)

### Starting with the React Email

It is a component library and framework specifically designed for building email templates using React components.
we can install it in our project by following commad

#### Setup

1.  **Install Dependencies:**

    ```bash
    npm install react-email @react-email/components @react-email/render
    ```

#### Documentation of React Email

Integration of ReactEmail with the Resend
[ReactEmailDocumentation](https://react.email/docs/integrations/resend)

### Connecting Your Namecheap Domain to Resend

To send emails from your custom domain (e.g., `you@yourdomain.com`) using Resend, you need to add specific DNS records to your domain's settings in Namecheap.

#### Phase 1: Get DNS Records from Resend

1.  **Log in to Resend:** Go to [https://resend.com/](https://resend.com/) and log in.
2.  **Navigate to Domains:** Find and click on "Domains" in the sidebar menu.
3.  **Add Domain:** Click "Add Domain" or "Verify Domain".
4.  **Enter Domain Name:** Input your domain registered with Namecheap (e.g., `yourdomain.com`) and click "Add".
5.  **Choose Region:** Select your preferred sending region.
6.  **View DNS Records:** Resend will display the DNS records needed. Keep this page open or carefully copy the `Type`, `Host/Name`, and `Value/Data/Target` for _each_ record. These typically include:
    - **DKIM (TXT Record):** For email authentication. Example Host: `resend._domainkey`, Example Value: A long string.
    - **SPF/Return-Path (CNAME Record):** For deliverability and bounce handling. Example Host: `bounce`, Example Value: `feedback-smtp.us-east-1.amazonses.com` (or similar).
    - **(Optional) Domain Verification (TXT Record):** Sometimes required initially.

#### Phase 2: Add DNS Records in Namecheap

1.  **Log in to Namecheap:** Go to [https://www.namecheap.com/](https://www.namecheap.com/) and log in.
2.  **Go to Domain List:** Navigate to your "Dashboard" -> "Domain List".
3.  **Select Domain:** Find your domain and click "Manage".
4.  **Navigate to Advanced DNS:** Click the "Advanced DNS" tab.
5.  **Check Nameservers:**
    - **IMPORTANT:** Verify the "Nameservers" setting.
    - If it's "Namecheap BasicDNS" or "Namecheap PremiumDNS", proceed below.
    - If it's "Custom DNS", you must add these records at your _custom DNS provider_ (e.g., Cloudflare, Vercel), **not** in Namecheap's Advanced DNS section.
6.  **Add New Records:** In the "Host Records" section, click "**Add New Record**" for each record from Resend:

    - **DKIM Record (TXT):**

      - **Type:** `TXT Record`
      - **Host:** Enter the `Host/Name` from Resend (e.g., `resend._domainkey`). _Note: Namecheap often auto-appends your domain, so just enter the subdomain part._
      - **Value:** Paste the long DKIM string from Resend _exactly_.
      - **TTL:** `Automatic` (or default).
      - **Save:** Click the green checkmark.

    - **Return-Path Record (CNAME):**

      - **Type:** `CNAME Record`
      - **Host:** Enter the `Host/Name` from Resend (e.g., `bounce`).
      - **Value/Target:** Paste the target domain from Resend (e.g., `feedback-smtp.us-east-1.amazonses.com`).
      - **TTL:** `Automatic` (or default).
      - **Save:** Click the green checkmark.

    - **Other TXT Records (if any):**
      - Follow the same steps as the DKIM record.

7.  **Review:** Double-check that the Type, Host, and Value in Namecheap exactly match the details provided by Resend.

#### Phase 3: Verify in Resend

1.  **Wait for Propagation:** DNS changes can take time (minutes to 48 hours, often under 1 hour).
2.  **Return to Resend:** Go back to the "Domains" section in your Resend dashboard.
3.  **Click Verify:** Find your domain and click the "Verify" or "Check Status" button.
4.  **Check Status:**
    - **Success:** The status should change to "Verified". You're ready to send emails from this domain!
    - **Failure:** Wait longer and try verifying again. If issues persist, carefully re-check the records in Namecheap for typos, especially in the `Host` and `Value` fields.

#### Troubleshooting Tips

- **Typos:** Double-check copied values.
- **Propagation:** Be patient. Use a tool like [DNS Checker](https://dnschecker.org/) to see if records are visible globally (check TXT and CNAME types).
- **Namecheap Host Field:** Remember Namecheap usually auto-appends the domain. If Resend gives `subdomain.yourdomain.com`, enter only `subdomain` in the Host field.
- **Correct Nameservers:** Ensure you're editing DNS where your nameservers point.
- **Conflicting Records:** Check for old SPF/DKIM records that might interfere.

#### Future Updation

- In case of the updation in this process visit the documentation of the resend

[Resend/NameCheapIntegration](https://resend.com/docs/knowledge-base/namecheap)

### Changes till now

- I have integrated the resend with the domain and also I have implemented the complete email integration with the Admin Section
- It incluses following section

1. Registeration with the Email verification
2. Password Reset with Email Verification

#### Steps to implement these

1. Create Email Templates with the Help of React Email.

- src/emails/PasswordResetEmail.tsx
- src/emails/VerificationEmail.tsx

2. Create a Email Sender file this will send the email to the Admin's Email.

- src/utils/emaiSender.ts

3. Create a tokenGeneration file which will create a token.

- src/utils/tokenUtils.ts

4. Updating the Admin Model.

- src/models/Admin.ts

5. Combine all thsese in one file.

- src/app/api/adminData/login_admin/route.ts

## Version 1

### Added the integration of Email with the User

- I have implemented the complete email integration with the User Section
- It incluses following section

1. Registeration with the Email verification
2. Password Reset with Email Verification

#### Steps to implement these

1. Create Email Templates with the Help of React Email.

- src/emails/PasswordResetEmailUser.tsx
- src/emails/VerificationEmailUser.tsx

2. Create a Email Sender file this will send the email to the User's Email.

- src/utils/emaiSender.ts

3. Create a tokenGeneration file which will create a token.

- src/utils/tokenUtils.ts

4. Updating the User Model.

- src/models/User.ts

5. Combine all thsese in one file.

- src/app/api/userData/login_user/route.ts


