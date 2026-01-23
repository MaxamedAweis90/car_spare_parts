"use client";

import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, Alert } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  SafetyCertificateTwoTone,
  CameraOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useSession } from "@/lib/auth/useSession";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/appwrite/storage";
import { useActivityLog } from "@/hooks/useActivityLog";

export default function AdminOnboarding() {
  const { profile, refresh } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();
  const logMutation = useActivityLog();

  useEffect(() => {
    // Trigger if profile exists but phone is missing
    if (profile && !profile.phone && profile.role.includes("admin")) {
      setIsModalOpen(true);
      form.setFieldsValue({
        name: profile.name,
      });
    }
  }, [profile, form]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      message.error("Image too large! Maximum size is 2MB.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      message.error("Please select an image file.");
      return;
    }

    // Clean up old preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create preview URL and store file
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  };

  const handleUpload = async (file: File) => {
    try {
      const bucketId = "avatars";
      const newFile = await uploadImage(bucketId, file);
      return newFile.$id;
    } catch (error) {
      console.error("Upload failed", error);
      throw error;
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      let avatarId = profile?.avatarId;

      // Handle Image Upload if selected
      if (selectedFile) {
        avatarId = await handleUpload(selectedFile);
      }

      const formData = new FormData();
      formData.append("email", profile?.email || "");
      formData.append("name", values.name);
      formData.append("phone", values.phone);
      if (avatarId) formData.append("avatarId", avatarId);

      const res = await fetch("/api/admin/profile/update", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update profile");

      // Log activity
      logMutation.mutate({
        action: "UPDATE_PROFILE",
        details: { name: values.name, phone: values.phone },
        targetId: profile.$id,
        targetType: "admin",
      });

      // Show success animation
      setShowSuccess(true);

      // Wait a moment for success message to be visible
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsModalOpen(false);

      // Small delay to ensure DB propagation
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Refresh session to reflect changes
      refresh();
      router.refresh();

      message.success("Welcome! Your profile is all set up! 🎉");
    } catch (error) {
      console.error(error);
      message.error("Failed to update profile. Please try again.");
      setShowSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isModalOpen}
      closable={false}
      footer={null}
      maskClosable={false}
      centered
      width={520}
      styles={{
        body: { padding: 0 },
      }}
    >
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-10 text-center text-white">
        <SafetyCertificateTwoTone
          twoToneColor="#fff"
          className="text-5xl mb-3"
        />
        <h2 className="text-2xl font-bold mb-2">Welcome to Admin Portal</h2>
        <p className="text-blue-100 text-sm">
          Complete your profile to get started
        </p>
      </div>

      {/* Success Alert */}
      {showSuccess && (
        <div className="px-8 pt-6">
          <Alert
            message="Profile Updated Successfully!"
            description="Redirecting to dashboard..."
            type="success"
            icon={<CheckCircleOutlined />}
            showIcon
            className="animate-in fade-in slide-in-from-top-2 duration-500"
          />
        </div>
      )}

      {/* Form Content */}
      <div className="px-8 py-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ name: profile?.name }}
          disabled={showSuccess}
        >
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div
                className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                onClick={() => document.getElementById("avatar-input")?.click()}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserOutlined className="text-5xl text-gray-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => document.getElementById("avatar-input")?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
              >
                <CameraOutlined className="text-lg" />
              </button>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Click to upload your photo (max 2MB)
            </p>
          </div>

          {/* Name Field */}
          <Form.Item
            name="name"
            label={<span className="font-semibold">Display Name</span>}
            rules={[
              { required: true, message: "Please input your display name!" },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="John Doe"
              size="large"
              className="rounded-lg"
            />
          </Form.Item>

          {/* Phone Field */}
          <Form.Item
            name="phone"
            label={<span className="font-semibold">Phone Number</span>}
            rules={[
              { required: true, message: "Please input your phone number!" },
              {
                pattern: /^\d{8,9}$/,
                message: "Phone must be 8-9 digits (without country code)",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="text-gray-400" />}
              addonBefore="+252"
              placeholder="61234567"
              size="large"
              className="rounded-lg"
            />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item className="mb-0 mt-6">
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              size="large"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 rounded-lg font-semibold h-12 shadow-md"
            >
              {submitting ? "Saving..." : "Save & Continue to Dashboard"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
