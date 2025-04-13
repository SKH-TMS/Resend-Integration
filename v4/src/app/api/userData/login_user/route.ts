import { NextResponse } from "next/server";
import { generateToken, setToken } from "@/utils/token";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { loginSchema } from "@/schemas/userSchema";
import { generateVerificationToken } from "@/utils/tokenUtils";
import { sendUserVerificationEmail } from "@/utils/emailSender";
import Team from "@/models/Team";
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: "Email and password are required.",
      });
    }
    // Validate the request data using the login schema
    const parsedData = loginSchema.safeParse({ email, password });

    if (!parsedData.success) {
      // If validation fails, return an error with the validation message
      const errorMessages = parsedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: errorMessages },
        { status: 400 }
      );
    }
    // Connect to the MongoDB database
    await connectToDatabase();
    // Find the user with the matching email
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +isVerified +verificationToken +verificationTokenExpires"
    );

    if (!user) {
      // If user is not found or password is incorrect
      return NextResponse.json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Compare hashed password with provided password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: "Invalid email or password.",
      });
    }
    if (!user.isVerified) {
      console.log(`Login attempt by unverified user: ${user.email}`);

      const now = new Date();
      if (
        !user.verificationToken ||
        !user.verificationTokenExpires ||
        user.verificationTokenExpires <= now
      ) {
        console.log(
          `Verification token expired or missing for ${user.email}. Generating new one.`
        );
        // Generate a NEW token
        const { rawToken, hashedToken, expiryDate } =
          generateVerificationToken();
        user.verificationToken = hashedToken;
        user.verificationTokenExpires = expiryDate;
        await user.save(); // Save the new token details

        // Resend verification email
        try {
          if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
            const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/userData/verify-email?token=${rawToken}`;
            await sendUserVerificationEmail({
              recipientName: user.firstname,
              recipientEmail: user.email,
              verificationUrl: verificationUrl,
            });
            console.log(`New verification email sent to ${user.email}.`);
            // Return specific response indicating email was resent
            return NextResponse.json(
              {
                success: false,
                message:
                  "Your email is not verified. A new verification link has been sent to your email address. Please check your inbox (and spam folder).",
                action: "resent_verification",
              },
              { status: 403 }
            );
          } else {
            console.error(
              "Cannot resend verification email: Email service not configured."
            );

            return NextResponse.json(
              {
                success: false,
                message:
                  "Your email is not verified, and the verification link may have expired. Please contact support.",
              },
              { status: 403 }
            );
          }
        } catch (emailError) {
          console.error(
            `Failed to resend verification email to ${user.email}:`,
            emailError
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Your email is not verified. There was an issue resending the verification link. Please try again later or contact support.",
            },
            { status: 403 }
          );
        }
      } else {
        // Token exists and is not expired, just tell them to verify
        return NextResponse.json(
          {
            success: false,
            message:
              "Your email address is not verified. Please check your inbox (and spam folder) for the verification link.",
            action: "needs_verification",
          },
          { status: 403 }
        );
      }
    }
    // Ensure profilePic exists, else use default
    const profilepic = user.profilepic
      ? user.profilepic
      : "/default-profile.png";

    //Handle Usertype for ProjectManager
    if (user.userType == "ProjectManager") {
      // Generate JWT token for the user
      const token = generateToken({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        profilepic: profilepic,
        contact: user.contact,
        userType: user.userType,
        UserId: user.UserId,
      });

      const res = NextResponse.json({
        success: true,
        message: "Login successful!",
        ProjectManager: {
          UserId: user.UserId,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          profilepic: profilepic,
          contact: user.contact,
          userType: user.userType,
        },
      });

      // Set the token in the cookie
      setToken(res, token);

      return res;
    } else {
      // Check if the user is a team leader by searching the Team collection for their UserId in teamLeader
      const teamLeaderTeam = await Team.findOne({ teamLeader: user.UserId });
      // Check if the user is a team member by searching the Team collection for their UserId in members
      const teamMemberTeam = await Team.findOne({ members: user.UserId });

      const isTeamLeader = Boolean(teamLeaderTeam);
      const isTeamMember = Boolean(teamMemberTeam);

      // Build an array of roles based on the team relationships
      const userRoles: string[] = [];
      if (isTeamLeader) userRoles.push("TeamLeader");
      if (isTeamMember) userRoles.push("TeamMember");

      if (isTeamLeader || isTeamMember) {
        // Always use the same property name ("userRoles")
        const token = generateToken({
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          profilepic: profilepic, // Ensure correct field is used
          contact: user.contact,
          userType: user.userType,
          UserId: user.UserId,
          userRoles,
        });

        const res = NextResponse.json({
          success: true,
          message: "Login successful!",
          user: {
            UserId: user.UserId,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            profilepic: profilepic,
            contact: user.contact,
            userType: user.userType,
            userRoles, // Always return userRoles (empty array if no role)
          },
        });

        // Set the token in the cookie
        setToken(res, token);
        return res;
      }
      // Generate JWT token for the user
      const token = generateToken({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        profilepic: profilepic, // Ensure correct field is used
        contact: user.contact,
        userType: user.userType,
        UserId: user.UserId,
      });

      const res = NextResponse.json({
        success: true,
        message: "Login successful!",
        user: {
          UserId: user.UserId,
          userRole: user.userRole,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          profilepic: profilepic,
          contact: user.contact,
          userType: user.userType,
        },
      });

      // Set the token in the cookie
      setToken(res, token);
      return res;
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to log in. Please try again later.",
    });
  }
}
