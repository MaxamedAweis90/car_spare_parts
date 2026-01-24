"use client";

import { useState } from "react";
import {
  Modal,
  Button,
  Radio,
  Typography,
  Space,
  message,
  Steps,
  Spin,
  Result,
} from "antd";
import {
  CreditCardOutlined,
  MobileOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const { Text, Title, Paragraph } = Typography;

interface ProcessPaymentModalProps {
  open: boolean;
  onCancel: () => void;
  orderId: string;
  amount: number;
}

export default function ProcessPaymentModal({
  open,
  onCancel,
  orderId,
  amount,
}: ProcessPaymentModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved methods
  const { data: methodsData, isLoading: methodsLoading } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      const res = await fetch("/api/payment-methods");
      return res.json();
    },
    enabled: open,
  });

  const savedMethods = methodsData?.paymentMethods || [];

  const handlePay = async () => {
    if (!selectedMethodId) {
      message.error("Please select a payment method");
      return;
    }

    try {
      setStep(1); // Processing step
      setProcessing(true);
      setError(null);

      // Find selected method details to send structure
      const method = savedMethods.find((m: any) => m.$id === selectedMethodId);

      const payload = {
        orderId,
        amount,
        paymentMethodId: selectedMethodId,
        // In real app we pass ID, but here helper needs input structure to fake it
        paymentMethodInput: {
          type: method.type,
          phoneNumber: method.phoneNumber,
          cardNumber: method.cardLast4
            ? `424242424242${method.cardLast4}`
            : undefined, // reconstructing fake card
          cardExpiry: method.cardExpiry,
          cardCvv: "123", // fake cvv
          cardholderName: method.cardholderName,
        },
      };

      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Payment failed");
      }

      setStep(2); // Success step
    } catch (err: any) {
      setError(err.message);
      setStep(3); // Failure step
    } finally {
      setProcessing(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 0: // Select Method
        return (
          <div className="py-4">
            <div className="mb-6 flex justify-between items-end border-b pb-4">
              <div>
                <Text type="secondary">Total to Pay</Text>
                <Title level={2} className="m-0 text-green-600">
                  ${amount.toFixed(2)}
                </Title>
              </div>
              <DollarOutlined className="text-3xl text-gray-200" />
            </div>

            {methodsLoading ? (
              <div className="flex justify-center p-8">
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                />
              </div>
            ) : savedMethods.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded">
                <Text>No saved payment methods found.</Text>
                <div className="mt-2">
                  <Text type="secondary" className="text-xs">
                    Please go to your Wallet to add one.
                  </Text>
                </div>
              </div>
            ) : (
              <Radio.Group
                className="w-full"
                onChange={(e) => setSelectedMethodId(e.target.value)}
                value={selectedMethodId}
              >
                <div className="space-y-3">
                  {savedMethods.map((method: any) => (
                    <div
                      key={method.$id}
                      className={`
                        border rounded-lg p-3 cursor-pointer transition-all
                        ${selectedMethodId === method.$id ? "border-green-500 bg-green-50" : "hover:border-gray-400"}
                      `}
                      onClick={() => setSelectedMethodId(method.$id)}
                    >
                      <Radio value={method.$id} className="w-full">
                        <Space className="w-full">
                          {method.type === "card" ? (
                            <CreditCardOutlined className="text-xl text-blue-500" />
                          ) : (
                            <MobileOutlined className="text-xl text-orange-500" />
                          )}
                          <div className="flex flex-col">
                            <Text strong>
                              {method.nickname ||
                                (method.type === "card"
                                  ? "Credit Card"
                                  : "Mobile Money")}
                            </Text>
                            <Text type="secondary" className="text-xs">
                              {method.type === "card"
                                ? `${method.cardBrand?.toUpperCase()} **** ${method.cardLast4}`
                                : `${method.provider === "evc_plus" ? "EVC Plus" : "eDahab"} • ${method.phoneNumber}`}
                            </Text>
                          </div>
                        </Space>
                      </Radio>
                    </div>
                  ))}
                </div>
              </Radio.Group>
            )}
          </div>
        );

      case 1: // Processing
        return (
          <div className="text-center py-12">
            <Spin size="large" />
            <Title level={4} className="mt-6">
              Processing Payment...
            </Title>
            <Text type="secondary">
              Please check your phone for prompt if using Mobile Money
            </Text>
          </div>
        );

      case 2: // Success
        return (
          <Result
            status="success"
            title="Payment Successful!"
            subTitle={`Transaction completed for Order #${orderId.slice(-6).toUpperCase()}`}
            extra={[
              <Button
                type="primary"
                key="close"
                onClick={() => {
                  onCancel();
                  router.refresh(); // Refresh page to show new status
                }}
              >
                Close
              </Button>,
            ]}
          />
        );

      case 3: // Failure
        return (
          <Result
            status="error"
            title="Payment Failed"
            subTitle={error || "Something went wrong. Please try again."}
            extra={[
              <Button key="retry" onClick={() => setStep(0)}>
                Try Again
              </Button>,
              <Button key="close" onClick={onCancel}>
                Close
              </Button>,
            ]}
          />
        );
    }
  };

  return (
    <Modal
      open={open}
      onCancel={processing ? undefined : onCancel}
      footer={
        step === 0
          ? [
              <Button key="cancel" onClick={onCancel} disabled={processing}>
                Cancel
              </Button>,
              <Button
                key="pay"
                type="primary"
                onClick={handlePay}
                loading={processing}
                disabled={!selectedMethodId}
              >
                Pay Now
              </Button>,
            ]
          : null
      }
      closable={step === 0}
      maskClosable={false}
      width={500}
      title={step === 0 ? "Make Payment" : null}
      destroyOnHidden={true}
    >
      {renderContent()}
    </Modal>
  );
}
