"use client";

import React, { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

interface UserProfileData {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
  contact?: string;
  userType: string;
}

interface ProfileFormData {
  firstname: string;
  lastname: string;
  contact: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Profile() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserData, setCurrentUserData] =
    useState<UserProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstname: "",
    lastname: "",
    contact: "",
  });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(
    null
  );
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(
    null
  );

  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userType: "User" }),
        });
        const data = await response.json();
        if (data.success && data.user && data.user.userRoles) {
          setIsAuthenticated(true);
          const user = data.user;
          if (!user.UserId) {
            console.warn("Fetched user data is missing UserId.");
          }
          setCurrentUserData({
            UserId: user.UserId || "",
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            profilepic: `${user.profilepic}?t=${new Date().getTime()}`,
            contact: user.contact || "",
            userType: user.userType,
          });
          setFormData({
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            contact: user.contact || "",
          });
        } else {
          setIsAuthenticated(false);
          throw new Error(
            data.message || "Authentication failed. Please log in."
          );
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching user data:", error);
        setError(error.message);
        toast.error(`Error: ${error.message}`);
        router.push("/userData/LoginUser");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordUpdateError(null);
  };
  const handleProfilePicButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      await uploadProfilePic(file);
    }
  };

  const uploadProfilePic = async (file: File) => {
    if (!currentUserData) {
      toast.error("User data missing.");
      return;
    }
    const uploadToastId = toast.loading("Uploading picture...");
    const formData = new FormData();
    formData.append("profilePic", file);
    formData.append("email", currentUserData.email);
    try {
      const response = await fetch("/api/upload/update-profile-pic", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      toast.dismiss(uploadToastId);
      if (data.success && data.profilePicUrl) {
        toast.success("Profile picture updated!");
        const updatedProfilePic = `${
          data.profilePicUrl
        }?t=${new Date().getTime()}`;
        setCurrentUserData((prevUser) =>
          prevUser ? { ...prevUser, profilepic: updatedProfilePic } : prevUser
        );
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error(`Upload failed: ${data.message || "Unknown error"}`);
        console.error("Upload failed:", data.message);
      }
    } catch (error) {
      toast.dismiss(uploadToastId);
      toast.error(
        `Error uploading file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      console.error("Error uploading file:", error);
    }
  };

  const handleProfileUpdateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUserData) return;
    if (
      formData.firstname === currentUserData.firstname &&
      formData.lastname === currentUserData.lastname &&
      formData.contact === (currentUserData.contact || "")
    ) {
      toast("No changes detected in profile information.", {
        icon: "ℹ️",
      });
      return;
    }
    setIsSubmittingProfile(true);
    setProfileUpdateError(null);
    const loadingToastId = toast.loading("Updating profile...");
    try {
      const response = await fetch("/api/userData/profile/update-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      toast.dismiss(loadingToastId);
      if (data.success && data.user) {
        toast.success("Profile updated successfully!");
        setCurrentUserData(data.user);
        setFormData({
          firstname: data.user.firstname || "",
          lastname: data.user.lastname || "",
          contact: data.user.contact || "",
        });
      } else {
        throw new Error(data.message || "Failed to update profile.");
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      const error = err as Error;
      console.error("Update Profile Error:", error);
      setProfileUpdateError(error.message);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordUpdateError(null);
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordUpdateError("Please fill in all password fields.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordUpdateError("New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordUpdateError(
        "New password must be at least 6 characters long."
      );
      return;
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      setPasswordUpdateError(
        "New password cannot be the same as the current password."
      );
      return;
    }
    setIsSubmittingPassword(true);
    const loadingToastId = toast.loading("Changing password...");
    try {
      const response = await fetch("/api/userData/profile/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await response.json();
      toast.dismiss(loadingToastId);
      if (data.success) {
        toast.success("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setCurrentPasswordVisible(false);
        setNewPasswordVisible(false);
        setConfirmPasswordVisible(false);
      } else {
        throw new Error(data.message || "Failed to change password.");
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      const error = err as Error;
      console.error("Password Change Error:", error);
      setPasswordUpdateError(error.message);
      toast.error(`Password change failed: ${error.message}`);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  if (error || !isAuthenticated || !currentUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{error || "User is not authenticated."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Profile Settings
        </h1>

        {/* Profile Header & Picture Upload Section */}
        <div className="bg-[#ecfbf4] shadow-lg rounded-lg p-6 border border-gray-200 mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            My Profile
          </h2>
          <Image
            key={currentUserData.profilepic}
            src={currentUserData.profilepic}
            alt="Profile Picture"
            width={120}
            height={120}
            className="rounded-full mx-auto border-4 border-gray-200 shadow-md mb-4 object-cover bg-gray-200"
            priority
          />
          <p className="text-lg font-semibold">
            {currentUserData.firstname} {currentUserData.lastname}
          </p>
          <p className="text-sm text-gray-500 mb-4">{currentUserData.email}</p>

          {/* Hidden File Input & Upload Button */}
          <input
            type="file"
            id="profilePicInput"
            accept="image/*"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={handleProfilePicButtonClick}
            className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm rounded shadow hover:bg-blue-600 transition-colors"
          >
            Change Profile Picture
          </button>
        </div>

        {/* Forms Section (Profile Update & Change Password) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Information Form */}
          <form
            onSubmit={handleProfileUpdateSubmit}
            className="bg-[#ecfbf4] shadow-lg rounded-lg p-6 border border-gray-200 space-y-5"
          >
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-5">
              Update Information
            </h2>
            {profileUpdateError && (
              <p className="text-sm text-red-600 text-center -mt-3 mb-3">
                {profileUpdateError}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="firstname"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#2c3532] focus:border-[#2c3532]"
                />
              </div>
              <div>
                <label
                  htmlFor="lastname"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#2c3532] focus:border-[#2c3532]"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="contact"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contact Number{" "}
                <span className="text-xs text-gray-500">(Optional)</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="tel"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleProfileChange}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-[#2c3532] focus:border-[#2c3532]"
                  placeholder="e.g., +1 555-123-4567"
                />
              </div>
            </div>
            <div className="text-sm text-gray-500 space-y-2 pt-3 border-t">
              <p>
                <span className="font-medium">Email:</span>{" "}
                {currentUserData.email} (Cannot be changed)
              </p>
              <p>
                <span className="font-medium">User ID:</span>{" "}
                {currentUserData.UserId} (Cannot be changed)
              </p>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingProfile ? "Saving..." : "Save Profile Changes"}
              </button>
            </div>
          </form>

          {/* Password Change Form */}
          <form
            onSubmit={handlePasswordChangeSubmit}
            className="bg-[#ecfbf4] shadow-lg rounded-lg p-6 border border-gray-200 space-y-5"
          >
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-5">
              Change Password
            </h2>
            {passwordUpdateError && (
              <p className="text-sm text-red-600 text-center -mt-3 mb-3">
                {passwordUpdateError}
              </p>
            )}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  type={currentPasswordVisible ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#2c3532] focus:border-[#2c3532] pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPasswordVisible(!currentPasswordVisible)
                  }
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-red-100 bg-white hover:bg-white"
                >
                  {currentPasswordVisible ? (
                    <EyeIcon className="h-5 w-5 bg-white" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5 bg-white" />
                  )}
                </button>
              </div>
            </div>
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
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#2c3532] focus:border-[#2c3532] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-red-100 bg-white hover:bg-white"
                >
                  {newPasswordVisible ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters long.
              </p>
            </div>
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
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#2c3532] focus:border-[#2c3532] pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-red-100 bg-white hover:bg-white"
                >
                  {confirmPasswordVisible ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
