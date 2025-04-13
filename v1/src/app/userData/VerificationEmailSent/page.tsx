"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EnvelopeOpenIcon, ClockIcon } from "@heroicons/react/24/outline";
function VerificationSentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    const countInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const redirectTimer = setTimeout(() => {
      router.push("/userData/LoginUser");
    }, countdown * 1000);

    return () => {
      clearInterval(countInterval);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 text-center">
        <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg max-w-lg border border-gray-200">
          <EnvelopeOpenIcon className="w-16 h-16 mx-auto text-green-500 mb-5" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Verification Email Sent!
          </h1>
          <p className="text-gray-600 mb-4">
            We've sent a verification link to your email address:
          </p>
          {email ? (
            <p className="font-semibold text-indigo-700 mb-6 break-words">
              {decodeURIComponent(email)}
            </p>
          ) : (
            <p className="font-semibold text-indigo-700 mb-6">
              your registered email address.
            </p>
          )}

          <p className="text-gray-600 mb-6">
            Please check your inbox (and spam/junk folder) and click the link to
            activate your admin account.
          </p>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <ClockIcon className="w-4 h-4 mr-1.5" />
            Redirecting to login in {countdown} seconds...
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerificationEmailSentPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="flex items-center justify-center min-h-screen">
            Loading...
          </div>
        </div>
      }
    >
      <VerificationSentContent />
    </Suspense>
  );
}
