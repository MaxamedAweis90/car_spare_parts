"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, message, Upload } from "antd";
import { UserOutlined, CameraOutlined } from "@ant-design/icons";
import { useSession } from "@/lib/auth/useSession";
import { AdvancedImageEditor } from "./AdvancedImageEditor";

export const CustomerProfileReminder: React.FC = () => {
  const { authenticated, profile, loading, refresh } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (loading || !authenticated || !profile) return;

    // Only for customers
    if (profile.role !== "customer") return;

    // Check if profile image is missing
    const hasImage = !!(profile.avatarId || profile.avatarUrl);

    // Check session storage to only show once per session
    const reminderDismissed = sessionStorage.getItem(
      "customer_profile_reminder_dismissed",
    );

    if (!hasImage && !reminderDismissed) {
      // Delay for better UX
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 5000); // 5 seconds delay for customers on main site
      return () => clearTimeout(timer);
    }
  }, [loading, authenticated, profile]);

  const handleDismiss = () => {
    setShowModal(false);
    sessionStorage.setItem("customer_profile_reminder_dismissed", "true");
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    return false; // Prevent automatic upload
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, "avatar.jpg");

      const res = await fetch("/api/customer/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload avatar");
      }

      message.success("Profile picture updated successfully!");
      refresh();
      handleDismiss();
    } catch (error) {
      console.error(error);
      message.error("Failed to update profile picture.");
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  if (!authenticated || profile?.role !== "customer") return null;

  return (
    <Modal
      title={null}
      open={showModal}
      onCancel={handleDismiss}
      footer={null}
      centered
      width={selectedImage ? 500 : 400}
      styles={{
        body: {
          padding: 0,
          overflow: "hidden",
          borderRadius: 24,
          backgroundColor: "#fff",
        },
      }}
      closable={!uploading}
    >
      {selectedImage ? (
        <AdvancedImageEditor
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setSelectedImage(null)}
        />
      ) : (
        <div className="p-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative group cursor-pointer">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-green-50 text-green-500 border-2 border-dashed border-green-200 group-hover:bg-green-100 transition-colors">
                <UserOutlined style={{ fontSize: 48 }} />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white shadow-lg border-4 border-white">
                <CameraOutlined style={{ fontSize: 18 }} />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-3">
            Make it Personal!
          </h2>
          <p className="text-slate-500 mb-10 leading-relaxed">
            Add a profile picture to personalize your account and stand out in
            the SomaParts community.
          </p>

          <div className="flex flex-col gap-4">
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleFileSelect}
            >
              <Button
                type="primary"
                size="large"
                block
                className="h-14 font-black rounded-2xl shadow-xl shadow-green-100 bg-green-600 hover:bg-green-700 border-none"
              >
                Upload Profile Picture
              </Button>
            </Upload>

            <Button
              type="text"
              block
              className="h-12 text-slate-400 font-bold hover:text-slate-600"
              onClick={handleDismiss}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
