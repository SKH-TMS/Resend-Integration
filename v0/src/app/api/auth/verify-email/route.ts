// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb"; // Adjust path
import Admin from "@/models/Admin"; // <--- USE ADMIN MODEL
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const { token: rawToken } = body; // Expect { "token": "RAW_TOKEN_FROM_URL" }

    if (!rawToken || typeof rawToken !== "string") {
      return NextResponse.json(
        { success: false, message: "Verification token is required." },
        { status: 400 }
      );
    }

    // 1. Hash the incoming raw token
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await connectToDatabase();

    // 2. Find ADMIN by hashed token and check expiry
    const admin = await Admin.findOne({
      // <--- Use Admin model
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }, // Check expiry
    });

    // 3. Handle Token Not Found or Expired
    if (!admin) {
      console.log(
        `Admin verification attempt failed: Token invalid or expired. Hashed token checked: ${hashedToken}`
      );
      // Check if a user exists with the token but it's expired
      const expiredAdmin = await Admin.findOne({
        verificationToken: hashedToken,
      }); // <--- Use Admin model
      if (expiredAdmin) {
        // Optionally, you could allow resending verification here
        return NextResponse.json(
          {
            success: false,
            message:
              "Verification token has expired. Please register again or request a new link.",
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { success: false, message: "Invalid verification token." },
          { status: 400 }
        );
      }
    }

    // 4. Mark Admin as Verified and Clear Token Info
    admin.isVerified = true;
    admin.verificationToken = undefined; // Clear token
    admin.verificationTokenExpires = undefined; // Clear expiry

    await admin.save(); // Save the changes

    console.log(`Admin ${admin.email} verified successfully.`);

    // 5. Return Success
    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Admin Email Verification Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Email verification failed due to a server error.",
      },
      { status: 500 }
    );
  }
}
