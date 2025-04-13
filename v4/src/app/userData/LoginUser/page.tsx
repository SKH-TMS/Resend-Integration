"use client";
import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";
import toast from "react-hot-toast";
export default function Login() {
  const { refreshAuth } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // useEffect(() => {
  //   const checkuserstatus = async () => {
  //     await refreshAuth();
  //   };
  //   checkuserstatus();
  // }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!email || !password) {
      alert("Both email and password are required!");
      return;
    }

    try {
      const response = await fetch("../../api/userData/login_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await response.json();

      if (data.success) {
        // Check for  user or admin field
        if (data?.user) {
          if (data.user.userRoles) {
            await refreshAuth();
            toast.success("Welcome to teams User");
            router.push("/teamData/ProfileTeam");
          } else {
            await refreshAuth();
            toast.success("User Login successful");
            router.push("ProfileUser");
          }
        } else if (data?.ProjectManager) {
          await refreshAuth();
          toast.success("ProjectManager Login successful");
          router.push("/projectManagerData/ProfileProjectManager");
        } else {
          toast.error("Unknown response structure");
          alert("Unknown response structure");
        }
      } else {
        if (
          data.action === "resent_verification" ||
          data.action === "needs_verification"
        ) {
          setError(data.message);
          toast.error(data.message);
        } else {
          setError(data.message || "Invalid email or password.");
          toast.error(data.message || "Invalid email or password.");
        }
      }
    } catch (error) {
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="screenMiddleDiv">
        <div className="formDiv">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-center">Login as User</h2>

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}

            <div>
              <label htmlFor="email" className="formLabel">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="my-6">
              <label htmlFor="password" className="formLabel">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="formButton" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center mt-4">
              <a
                href="/userData/ForgotPasswordUser"
                className="text-sm hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            <div className="text-center mt-4">
              <Link
                href="/userData/RegisterUser"
                className="buttonTiny text-white"
              >
                Register as User
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
