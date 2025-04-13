"use client";
import React, { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  IdentificationIcon,
  CameraIcon,
  UsersIcon as GroupIcon,
  BriefcaseIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

// Interface for fetched admin data (ensure it includes AdminId or equivalent)
interface AdminProfileData {
  id: string; // Assuming 'id' is the custom Admin ID like 'Admin-1'
  AdminId?: string; // Include if your token/backend also provides the general UserId
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
  contact?: string;
  userType: string; // Should be 'Admin'
}

// Interface for editable profile form data
interface ProfileFormData {
  firstname: string;
  lastname: string;
  contact: string;
}

// Interface for password change form data
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfileAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdminData, setCurrentAdminData] =
    useState<AdminProfileData | null>(null);
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

  const [loading, setLoading] = useState(true); // For initial fetch
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false); // Added back

  const [error, setError] = useState<string | null>(null); // General fetch error
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For image preview

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Ref for file input

  // Fetch initial admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the endpoint specified in original ProfileAdmin
        const response = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userType: "Admin" }), // Fetch Admin data
        });

        const data = await response.json();

        // Use the data structure from original ProfileAdmin (data.admin)
        if (data.success && data.admin) {
          setIsAuthenticated(true);
          const admin = data.admin;
          // Ensure the custom ID 'id' is present
          if (!admin.id) {
            console.warn(
              "Fetched admin data is missing the custom 'id' field."
            );
          }
          setCurrentAdminData({
            ...admin, // Spread fetched admin data
            profilepic: `${admin.profilepic}?t=${new Date().getTime()}`,
          });
          // Initialize form with fetched data
          setFormData({
            firstname: admin.firstname || "",
            lastname: admin.lastname || "",
            contact: admin.contact || "",
          });
        } else {
          setIsAuthenticated(false);
          throw new Error(
            data.message || "Authentication failed. Please log in."
          );
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching admin data:", error);
        setError(error.message);
        toast.error(`Error: ${error.message}`);
        router.push("/adminData/LoginAdmin"); // Redirect to Admin login on error
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers for form inputs
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordUpdateError(null);
  };

  // Handler for profile picture selection and preview
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // Trigger hidden file input click
  const handleProfilePicButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handler for profile picture upload - USES ADMIN ENDPOINT
  const handleUpload = async () => {
    if (!selectedFile || !currentAdminData) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploadingPicture(true);
    const uploadToastId = toast.loading("Uploading picture...");
    const formDataToUpload = new FormData();
    formDataToUpload.append("profilePic", selectedFile);
    // Use non-null assertion since we already checked currentAdminData
    formDataToUpload.append("email", currentAdminData!.email);

    try {
      // Use the ADMIN-specific endpoint from original ProfileAdmin
      const response = await fetch("/api/upload/admin-update-profile-pic", {
        method: "POST",
        body: formDataToUpload,
      });

      const data = await response.json();
      toast.dismiss(uploadToastId);

      if (data.success && data.profilePicUrl) {
        toast.success("Profile picture updated!");
        const updatedProfilePic = `${data.profilePicUrl}?t=${new Date().getTime()}`;
        setCurrentAdminData((prev) =>
          prev ? { ...prev, profilepic: updatedProfilePic } : null
        );
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
      } else {
        throw new Error(data.message || "Upload failed.");
      }
    } catch (err) {
      toast.dismiss(uploadToastId);
      const error = err as Error;
      console.error("Error uploading file:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Handler for submitting profile updates (name, contact)
  // Assumes a generic or admin-specific endpoint exists based on token auth
  const handleProfileUpdateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentAdminData) return;
    if (
      formData.firstname === currentAdminData.firstname &&
      formData.lastname === currentAdminData.lastname &&
      formData.contact === (currentAdminData.contact || "")
    ) {
      toast("No changes detected.", { icon: "ℹ️" });
      return;
    }
    setIsSubmittingProfile(true);
    setProfileUpdateError(null);
    const loadingToastId = toast.loading("Updating profile...");
    try {
      // Use the generic update route (adjust if you have an admin-specific one)
      const response = await fetch("/api/adminData/profile/update-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      toast.dismiss(loadingToastId);
      if (data.success && data.user) {
        toast.success("Profile updated successfully!");
        // Update state with potentially modified user data structure
        setCurrentAdminData((prev) =>
          prev ? { ...prev, ...data.user } : null
        );
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

  // Handler for submitting password change
  // Assumes a generic or admin-specific endpoint exists based on token auth
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
      const response = await fetch("/api/adminData/profile/change-password", {
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

  // --- Render Logic ---

  // Early returns to ensure currentAdminData is not null during render
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !isAuthenticated || !currentAdminData) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <p>{error || "User not authenticated or data unavailable."}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen  py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="bg-[#ecfbf4] shadow-lg rounded-lg p-6 border border-gray-200 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Admin Profile
            </h1>
            <Image
              key={currentAdminData.profilepic}
              src={previewUrl || currentAdminData.profilepic} // Show preview or current pic
              alt="Profile Picture"
              width={120}
              height={120}
              className="rounded-full mx-auto border-4 border-gray-200 shadow-md mb-4 object-cover bg-gray-200"
              priority
            />
            <p className="text-lg font-semibold">
              {currentAdminData.firstname} {currentAdminData.lastname}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {currentAdminData.email}
            </p>
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleProfilePicButtonClick}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              >
                <CameraIcon className="w-4 h-4 mr-2" />{" "}
                {selectedFile ? "Change Picture" : "Select Picture"}
              </button>
              <input
                id="profilePicInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              {selectedFile && (
                <span className="text-xs text-gray-500">
                  {selectedFile.name}
                </span>
              )}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploadingPicture}
                className="mt-1 px-4 py-1.5 bg-blue-500 text-white text-sm rounded shadow hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingPicture ? "Uploading..." : "Upload Picture"}
              </button>
            </div>
          </div>
          {/* Admin Navigation Buttons Section */}
          <div className="bg-[#ecfbf4] shadow-lg rounded-lg p-6 border border-gray-200 mt-8">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-5">
              Admin Actions
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => router.push("AllUsers")}
                className="inline-flex items-center px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md shadow hover:bg-green-600"
              >
                <GroupIcon className="w-5 h-5 mr-2" /> Show All Users
              </button>
              <button
                onClick={() => router.push("AllProjectManagers")}
                className="inline-flex items-center px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-md shadow hover:bg-rose-600"
              >
                <BriefcaseIcon className="w-5 h-5 mr-2" /> Show All Project
                Managers
              </button>
              <button
                onClick={() => router.push("AllTeamParticipants")}
                className="inline-flex items-center px-4 py-2 bg-cyan-500 text-white text-sm font-medium rounded-md shadow hover:bg-cyan-600"
              >
                <UserGroupIcon className="w-5 h-5 mr-2" /> Show All Team
                Participants
              </button>
              {/* Add other admin links/buttons here */}
            </div>
          </div>
          {/* Forms Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Profile Information Form */}
            <form
              onSubmit={handleProfileUpdateSubmit}
              className="bg-[#ecfbf4] shadow-lg rounded-lg p-6 border border-gray-200 space-y-5"
            >
              <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-5">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#2c3532] focus:border-[#2c3532]"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#2c3532] focus:border-[#2c3532]"
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
                    className="w-full block pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-[#2c3532] focus:border-[#2c3532]"
                    placeholder="e.g., +1 555-123-4567"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500 space-y-2 pt-3 border-t">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {currentAdminData.email} (Cannot be changed)
                </p>
                <p>
                  <span className="font-medium">Admin ID:</span>{" "}
                  {currentAdminData.id} (Cannot be changed)
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-5">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#2c3532] focus:border-[#2c3532] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPasswordVisible(!currentPasswordVisible)
                    }
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600  bg-white hover:bg-white"
                  >
                    {currentPasswordVisible ? (
                      <EyeIcon className="h-5 w-5" />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5" />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#2c3532] focus:border-[#2c3532] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600  bg-white hover:bg-white"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#2c3532] focus:border-[#2c3532] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmPasswordVisible(!confirmPasswordVisible)
                    }
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600  bg-white hover:bg-white"
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
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
