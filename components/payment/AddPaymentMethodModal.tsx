"use client";

import { useState } from "react";
import { Modal, Form, Input, Select, Button, Divider, App } from "antd";
import {
  CreditCardOutlined,
  MobileOutlined,
  LockOutlined,
} from "@ant-design/icons";
import {
  validateSomaliaPhone,
  validateCardNumber,
} from "@/lib/utils/fakePayment";

interface AddPaymentMethodModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddPaymentMethodModal({
  open,
  onCancel,
  onSuccess,
}: AddPaymentMethodModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [methodType, setMethodType] = useState<"card" | "mobile_money">(
    "mobile_money",
  );
  const { message } = App.useApp();

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const payload: any = {
        type: values.type,
        isDefault: values.isDefault,
        nickname: values.nickname,
      };

      if (values.type === "evc_plus" || values.type === "edahab") {
        if (!validateSomaliaPhone(values.phoneNumber)) {
          message.error("Invalid Somalia phone number");
          setLoading(false);
          return;
        }
        payload.phoneNumber = values.phoneNumber;
      } else {
        if (!validateCardNumber(values.cardNumber)) {
          message.error("Invalid card number");
          setLoading(false);
          return;
        }
        payload.cardNumber = values.cardNumber;
        payload.cardExpiry = values.cardExpiry;
        payload.cardholderName = values.cardholderName;
      }

      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save payment method");
      }

      message.success("Payment method saved successfully");
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add New Payment Method"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden={true}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: "evc_plus",
          isDefault: false,
        }}
        onValuesChange={(changed) => {
          if (changed.type) {
            setMethodType(
              ["evc_plus", "edahab"].includes(changed.type)
                ? "mobile_money"
                : "card",
            );
          }
        }}
      >
        <Form.Item
          name="type"
          label="Payment Provider"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="evc_plus">EVC Plus (Hormuud)</Select.Option>
            <Select.Option value="edahab">eDahab (Telesom)</Select.Option>
            <Select.Option value="card">Credit/Debit Card</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="nickname" label="Nickname (Optional)">
          <Input placeholder="e.g. My Personal EVC" />
        </Form.Item>

        <Divider />

        {methodType === "mobile_money" ? (
          <>
            <Form.Item
              name="phoneNumber"
              label="Phone Number"
              rules={[
                { required: true, message: "Please enter phone number" },
                {
                  pattern: /^(252|0)\d{9}$/,
                  message: "Format: 252XXXXXXXXX or 0XXXXXXXXX",
                },
              ]}
              extra="We'll send a payment prompt to this number"
            >
              <Input prefix={<MobileOutlined />} placeholder="25261xxxxxxx" />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              name="cardholderName"
              label="Cardholder Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="JOHN DOE" />
            </Form.Item>

            <Form.Item
              name="cardNumber"
              label="Card Number"
              rules={[{ required: true }]}
            >
              <Input
                prefix={<CreditCardOutlined />}
                placeholder="0000 0000 0000 0000"
              />
            </Form.Item>

            <div className="flex gap-4">
              <Form.Item
                name="cardExpiry"
                label="Expiry (MM/YY)"
                className="flex-1"
                rules={[{ required: true }]}
              >
                <Input placeholder="MM/YY" />
              </Form.Item>

              <Form.Item
                name="cvv"
                label="CVV"
                className="w-24"
                rules={[{ required: true }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  maxLength={4}
                  placeholder="123"
                />
              </Form.Item>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Method
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
