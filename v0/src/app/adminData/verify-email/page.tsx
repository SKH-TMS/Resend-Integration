"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setMessage("Invalid verification link. No token found.");
      setStatus("error");
      return;
    }

    const verifyToken = async () => {
      setStatus("loading");
      setMessage("Verifying your email...");
      try {
        // Calls the API route (which now handles Admins)
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage(
            data.message ||
              "Email verified successfully! Redirecting to login..."
          );
          toast.success("Verification successful!");
          // Redirect to ADMIN login after a short delay
          setTimeout(() => {
            router.push("/adminData/LoginAdmin"); // <--- Redirect to Admin Login
          }, 3000);
        } else {
          throw new Error(data.message || "Verification failed.");
        }
      } catch (err) {
        const error = err as Error;
        console.error("Verification API call error:", error);
        setStatus("error");
        setMessage(error.message || "An error occurred during verification.");
        toast.error(`Verification failed: ${error.message}`);
      }
    };

    verifyToken();
  }, [searchParams, router]);

  // --- Render based on status ---
  let content;
  let bgColor = "bg-white";
  let textColor = "text-gray-700";

  switch (status) {
    case "loading":
      content = <p>{message}</p>;
      bgColor = "bg-blue-50";
      textColor = "text-blue-700";
      break;
    case "success":
      content = <p>{message}</p>;
      bgColor = "bg-green-50";
      textColor = "text-green-700";
      break;
    case "error":
      content = (
        <div>
          <p className="font-semibold mb-2">Verification Failed</p>
          <p>{message}</p>
          <button
            onClick={() => router.push("/adminData/LoginAdmin")} // <-- Link to Admin Login
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
          >
            Go to Admin Login
          </button>
        </div>
      );
      bgColor = "bg-red-50";
      textColor = "text-red-700";
      break;
    default:
      content = null;
  }

  return (
    <div className={`flex items-center justify-center min-h-screen ${bgColor}`}>
      <div
        className={`p-8 rounded-lg shadow-md text-center max-w-md ${textColor}`}
      >
        {content}
      </div>
    </div>
  );
}

// Wrap component in Suspense because useSearchParams is used
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
