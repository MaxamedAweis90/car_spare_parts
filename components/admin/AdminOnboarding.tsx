"use client";

import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Upload, message, Avatar } from "antd";
import {
  UserOutlined,
  UploadOutlined,
  PhoneOutlined,
  SafetyCertificateTwoTone,
} from "@ant-design/icons";
import { useSession } from "@/lib/auth/useSession";
import { useRouter } from "next/navigation";
import { uploadImage, getImageUrl } from "@/lib/appwrite/storage";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

export default function AdminOnboarding() {
  const { profile, refresh } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Trigger if profile exists but phone is missing
    if (profile && !profile.phone && profile.role.includes("admin")) {
      setIsModalOpen(true);
      form.setFieldsValue({
        name: profile.name,
      });
    }
  }, [profile, form]);

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

      // Handle Image Upload if changed
      if (fileList.length > 0 && fileList[0].originFileObj) {
        avatarId = await handleUpload(fileList[0].originFileObj as File);
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

      message.success("Profile updated successfully!");
      setIsModalOpen(false);

      // Refresh session to reflect changes
      refresh(); // Sync updated profile data
      router.refresh(); // Refresh server components if any
    } catch (error) {
      console.error(error);
      message.error("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([file]); // Keep only 1 file
      return false; // Prevent auto upload
    },
    fileList,
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-xl mb-4">
          <SafetyCertificateTwoTone twoToneColor="#52c41a" />
          <span>Welcome to Admin Portal</span>
        </div>
      }
      open={isModalOpen}
      closable={false}
      footer={null}
      maskClosable={false}
      centered
      width={500}
    >
      <div className="text-center mb-6 text-gray-500">
        <p>Please complete your admin profile to continue.</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ name: profile?.name }}
      >
        <div className="flex justify-center mb-6">
          {/* Avatar Preview */}
          <Upload
            {...uploadProps}
            listType="picture-card"
            maxCount={1}
            showUploadList={{ showPreviewIcon: false }}
          >
            {fileList.length >= 1 ? null : (
              <div className="flex flex-col items-center">
                <UserOutlined />
                <div style={{ marginTop: 8 }}>Upload Photo</div>
              </div>
            )}
          </Upload>
        </div>

        <Form.Item
          name="name"
          label="Display Name"
          rules={[
            { required: true, message: "Please input your display name!" },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="John Doe"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[
            { required: true, message: "Please input your phone number!" },
            { pattern: /^\d+$/, message: "Phone number must be digits only" },
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="1234567890"
            size="large"
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            block
            size="large"
            className="bg-blue-600 hover:bg-blue-500"
          >
            Save & Continue to Dashboard
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
