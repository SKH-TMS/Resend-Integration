"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

export default function Profile() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePic: "/default-profile.png",
    contact: "",
    userType: "",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("../../api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userType: "ProjectManager",
          }),
        });

        const data = await response.json();
        console.log("User data:", data);

        if (data.success) {
          setIsAuthenticated(true);
          setUser({
            firstName: data.ProjectManager.firstname,
            lastName: data.ProjectManager.lastname,
            email: data.ProjectManager.email,
            profilePic: data.ProjectManager.profilepic
              ? `${data.ProjectManager.profilepic}?t=${new Date().getTime()}`
              : "/default-profile.png",
            contact: data.ProjectManager.contact || "",
            userType: data.ProjectManager.userType,
          });
        } else {
          setIsAuthenticated(false);
          setErrorMessage(data.message || "Invalid token");
          toast.error(data.message || "Invalid token");
          router.push("/userData/LoginUser");
        }
      } catch (error) {
        console.error("Error fetching ProjectManager data:", error);
        setErrorMessage(
          "Failed to fetch ProjectManager data. Please try again later."
        );
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/userData/LoginUser");
    }
  }, [isAuthenticated, loading, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("profilePic", selectedFile);
    formData.append("email", user.email);

    try {
      const response = await fetch("../../api/upload/update-profile-pic", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        // Force browser to fetch new image by appending timestamp
        const updatedProfilePic = `${
          data.profilePicUrl
        }?t=${new Date().getTime()}`;

        setUser((prevUser) => ({
          ...prevUser,
          profilePic: updatedProfilePic,
        }));
      } else {
        console.error("Upload failed:", data.message);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  if (errorMessage) {
    return (
      <div>
        <h2>Error: {errorMessage}</h2>
        <p>Please log in again.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>No user credentials found</h2>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="mt-4 p-4 border  shadow-2xl rounded-lg  w-80 text-center">
          <Image
            src={user.profilePic}
            alt="Profile Picture"
            width={100}
            height={100}
            className="rounded-full mx-auto"
          />
          <h2 className="mt-4 text-lg font-semibold">{user.userType}</h2>
          <h2 className="mt-4 text-lg font-semibold">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-gray-600">{user.email}</p>
          {user.contact && (
            <p className="text-gray-500">Contact: {user.contact}</p>
          )}
          <input type="file" onChange={handleFileChange} className="mt-4" />
          <button
            onClick={handleUpload}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Change Profile Picture
          </button>
          {/*  Manage Projects */}
          <button
            onClick={() =>
              router.push(
                "/projectManagerData/ProjectManagementData/ManageProject"
              )
            }
            className="mt-4 px-4 py-2 bg-sky-400 text-white rounded hover:bg-sky-500"
          >
            Manage Projects
          </button>
          {/*  Manage Teams */}
          <button
            onClick={() =>
              router.push("/projectManagerData/teamManagementData/ManageTeams")
            }
            className="mt-4 px-4 py-2 bg-indigo-400 text-white rounded hover:bg-indigo-500"
          >
            Manage Teams
          </button>
          <button
            onClick={() =>
              router.push("/projectManagerData/taskManagementData/ManageTasks")
            }
            className="mt-4 px-4 py-2 bg-indigo-400 text-white rounded hover:bg-indigo-500"
          >
            Manage Tasks
          </button>
        </div>
      </div>
    </div>
  );
}
