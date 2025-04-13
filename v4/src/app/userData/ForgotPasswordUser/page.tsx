"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeftIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

export default function ForgotPasswordAdmin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // For success/error messages
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    const loadingToastId = toast.loading("Sending reset link...");

    try {
      const response = await fetch("/api/userData/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();
      toast.dismiss(loadingToastId);

      setMessage(data.message || "An unexpected error occurred.");

      if (data.success) {
        setIsSuccess(true); // Indicate success state
        toast.success("Password reset instructions sent (if account exists).");
        setEmail(""); // Clear email field on success
      } else {
        setIsSuccess(false);
        toast.error(data.message || "Failed to send reset link.");
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error("Forgot Password Submit Error:", error);
      const errorMsg = "An error occurred. Please try again later.";
      setMessage(errorMsg);
      setIsSuccess(false);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center min-h-screen  px-4 py-12">
        <div className="formDiv">
          <button onClick={() => router.back()} className="buttonback">
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
          </button>
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-center text-2xl font-bold text-gray-800">
              Forgot Admin Password
            </h2>
            <p className="text-center text-sm text-gray-600">
              Enter your email address below, and we'll send you a link to reset
              your password (if an account exists).
            </p>

            {/* Display Message (Success or Error) */}
            {message && (
              <p
                className={`text-sm text-center p-3 rounded border ${isSuccess ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
              >
                {message}
              </p>
            )}

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Registered Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="email"
                  id="email"
                  className="w-full block pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0f6466] focus:border-[#0f6466]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isSuccess} // Disable after success too
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0f6466] hover:bg-[#2c3532] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c3532] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            {/* Link back to Login */}
            <div className="text-center text-sm mt-6">
              <Link href="/userData/LoginUser" className="formLabel">
                Login here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
