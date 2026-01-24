"use client";

import { Modal, Alert, Button, Progress } from "antd";
import { ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";

interface SessionTimeoutWarningProps {
  show: boolean;
  remainingSeconds: number;
  onExtend: () => void;
}

export default function SessionTimeoutWarning({
  show,
  remainingSeconds,
  onExtend,
}: SessionTimeoutWarningProps) {
  const percentage = (remainingSeconds / 30) * 100; // 30 seconds warning window

  return (
    <Modal
      open={show}
      closable={false}
      footer={null}
      centered
      maskClosable={false}
      width={480}
      styles={{
        body: { padding: 0 },
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <WarningOutlined className="text-3xl" />
          <div>
            <h3 className="text-xl font-bold mb-1">Session Expiring Soon</h3>
            <p className="text-sm text-amber-50">
              Your admin session will expire due to inactivity
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        <Alert
          message={
            <div className="flex items-center justify-between">
              <span className="font-semibold">Time Remaining</span>
              <span className="text-2xl font-bold text-orange-600">
                {remainingSeconds}s
              </span>
            </div>
          }
          description={
            <div className="mt-3">
              <Progress
                percent={percentage}
                strokeColor={{
                  "0%": "#f59e0b",
                  "100%": "#ef4444",
                }}
                showInfo={false}
                status="active"
              />
              <p className="text-xs text-gray-600 mt-2">
                Click "Stay Logged In" to continue your session
              </p>
            </div>
          }
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          className="border-amber-200"
        />

        <div className="mt-5 space-y-3">
          <Button
            type="primary"
            size="large"
            block
            onClick={onExtend}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 font-semibold h-12"
          >
            <ClockCircleOutlined className="mr-2" />
            Stay Logged In
          </Button>

          <p className="text-center text-xs text-gray-500">
            For security, admin sessions expire after 5 minutes of inactivity
          </p>
        </div>
      </div>
    </Modal>
  );
}
