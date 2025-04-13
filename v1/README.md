# Version 1

## Added the integration of Email with the User

- I have implemented the complete email integration with the User Section
- It incluses following section

1. Registeration with the Email verification
2. Password Reset with Email Verification

### Steps to implement these

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
