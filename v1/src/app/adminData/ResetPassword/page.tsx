"use client";
import React, { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import toast from "react-hot-toast";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing password reset link.");
      toast.error("Invalid or missing password reset link.");

      router.push("/adminData/ForgotPasswordAdmin");
    }
  }, [token, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError("Password reset token is missing.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const loadingToastId = toast.loading("Resetting password...");

    try {
      const response = await fetch("/api/adminData/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      toast.dismiss(loadingToastId);

      if (data.success) {
        setSuccessMessage(data.message || "Password reset successfully!");
        toast.success("Password reset successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          router.push("/adminData/LoginAdmin");
        }, 3000);
      } else {
        throw new Error(data.message || "Failed to reset password.");
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      const error = err as Error;
      console.error("Reset Password Submit Error:", error);
      setError(error.message);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!token && !loading) {
    return (
      <div>
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Invalid Link
            </h2>
            <p className="text-gray-600 mb-4">
              {error ||
                "This password reset link is invalid or missing a token."}
            </p>
            <Link
              href="/adminData/ForgotPasswordAdmin"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center min-h-screen  px-4 py-12">
        <div className="w-full max-w-md bg-[#ecfbf4] rounded-lg shadow-md p-6 md:p-8">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">
            Reset Admin Password
          </h2>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 text-center bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 mr-2" />
              {successMessage}
            </div>
          )}

          {/* Show form only if not successful */}
          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Error */}
              {error && (
                <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded border border-red-200">
                  {error}
                </p>
              )}

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={newPasswordVisible ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#2c3532] focus:border-[#2c3532] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 bg-white hover:bg-white"
                  >
                    {" "}
                    {newPasswordVisible ? (
                      <EyeIcon className="h-5 w-5" />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5" />
                    )}{" "}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters long.
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#2c3532] focus:border-[#2c3532] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmPasswordVisible(!confirmPasswordVisible)
                    }
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 bg-white hover:bg-white"
                  >
                    {" "}
                    {confirmPasswordVisible ? (
                      <EyeIcon className="h-5 w-5" />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5" />
                    )}{" "}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !token} // Disable if no token or loading
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0f6466] hover:bg-[#2c3532] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c3532] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {/* Link back to Login */}
          <div className="text-center text-sm mt-6">
            <Link
              href="/adminData/LoginAdmin"
              className=" bg-[#2c3532] text-slate-300 hover:text-black hover:bg-[#0f6466]"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="flex justify-center items-center min-h-screen">
            Loading...
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
