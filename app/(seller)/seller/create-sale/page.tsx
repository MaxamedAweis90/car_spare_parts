"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  InputNumber,
  Space,
  App,
  Select,
  Divider,
  Radio,
  Tag,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  MobileOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import CustomerSearchInput from "@/components/seller/CustomerSearchInput";
import ProductSearchInput from "@/components/seller/ProductSearchInput";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function CreateSalePage() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerPaymentMethods, setCustomerPaymentMethods] = useState<any[]>(
    [],
  );
  const [loadingMethods, setLoadingMethods] = useState(false);

  // Fetch customer payment methods when customer changes
  useEffect(() => {
    async function fetchMethods() {
      if (!selectedCustomer?.$id) {
        setCustomerPaymentMethods([]);
        return;
      }

      setLoadingMethods(true);
      try {
        // We need a way to fetch methods by userId.
        // The current API might stick to logged-in user.
        // We'll try passing userId query param if the API supports it, or we rely on the seller creating a fresh "manual" payment.
        // Assuming /api/payment-methods?userId=... for admins/sellers
        const res = await fetch(
          `/api/payment-methods?userId=${selectedCustomer.$id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setCustomerPaymentMethods(data?.paymentMethods || []);
        }
      } catch (e) {
        console.error("Failed to fetch customer methods", e);
      } finally {
        setLoadingMethods(false);
      }
    }

    if (selectedCustomer) {
      // Auto-fill address if available
      // Note: User object might not have address unless we store it.
      // We skip address auto-fill for now unless user detail has it.
      fetchMethods();
    }
  }, [selectedCustomer]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Determine payment details based on selection
      let paymentDetails = null;
      let paymentMethodType = values.paymentMethod; // default to value

      // Check if a saved method was selected (starts with "saved_")
      if (values.paymentMethod.startsWith("saved_")) {
        const methodId = values.paymentMethod.replace("saved_", "");
        const savedMethod = customerPaymentMethods.find(
          (m) => m.$id === methodId,
        );

        if (savedMethod) {
          paymentMethodType = savedMethod.type; // card or mobile_money
          paymentDetails = {
            savedMethodId: savedMethod.$id,
            type: savedMethod.type,
            phoneNumber: savedMethod.phoneNumber,
            cardLast4: savedMethod.cardLast4,
          };
        }
      } else if (values.paymentMethod === "mobile_money") {
        paymentDetails = { phoneNumber: values.phoneNumber };
      }

      // Extract IDs from search inputs (which return objects)
      const customerId = values.customerId?.value || values.customerId;

      const items = (values.items || []).map((item: any) => ({
        productId: item.productId?.value || item.productId,
        quantity: item.quantity,
      }));

      const response = await fetch("/api/seller/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          items,
          shippingAddress: values.shippingAddress,
          paymentMethod: paymentMethodType, // cash, card, mobile_money
          paymentDetails,
          isSellerAssisted: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      message.success("Order created successfully!");
      router.push("/seller/orders");
    } catch (error: any) {
      console.error("Submit error:", error);
      message.error(error.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 min-h-[80vh] max-w-5xl mx-auto pb-20">
      <div>
        <Title level={2} style={{ margin: 0 }}>
          Create Sale
        </Title>
        <Text type="secondary">Create an order on behalf of a customer</Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          paymentMethod: "cash",
          items: [{ productId: null, quantity: 1 }], // productId will be object from search
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Order Details */}
          <div className="md:col-span-2 space-y-6">
            <Card title="Order Items" className="shadow-sm">
              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <div className="space-y-4">
                    {fields.map(({ key, name, ...restField }) => (
                      <div
                        key={key}
                        className="flex gap-4 items-start bg-slate-50 p-4 rounded-lg border border-slate-200"
                      >
                        <Form.Item
                          {...restField}
                          name={[name, "productId"]}
                          className="flex-1 mb-0"
                          rules={[{ required: true, message: "Required" }]}
                        >
                          <ProductSearchInput />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          className="w-24 mb-0"
                          rules={[{ required: true, message: "Required" }]}
                        >
                          <InputNumber
                            min={1}
                            placeholder="Qty"
                            className="w-full"
                          />
                        </Form.Item>

                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Product
                    </Button>
                  </div>
                )}
              </Form.List>
            </Card>

            <Card title="Shipping & Payment" className="shadow-sm">
              <Form.Item
                label="Shipping Address"
                name="shippingAddress"
                rules={[
                  { required: true, message: "Please enter shipping address" },
                ]}
              >
                <TextArea rows={3} placeholder="Full address" />
              </Form.Item>

              <Divider />

              <Form.Item
                label="Payment Method"
                name="paymentMethod"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select payment method"
                  loading={loadingMethods}
                >
                  <Select.OptGroup label="Manual / Offline">
                    <Option value="cash">Cash on Delivery</Option>
                    <Option value="mobile_money">Manual Mobile Money</Option>
                    <Option value="card">Manual Card (Terminal)</Option>
                  </Select.OptGroup>

                  {customerPaymentMethods.length > 0 && (
                    <Select.OptGroup label="Customer Saved Methods">
                      {customerPaymentMethods.map((method) => (
                        <Option key={method.$id} value={`saved_${method.$id}`}>
                          <Space>
                            {method.type === "card" ? (
                              <CreditCardOutlined />
                            ) : (
                              <MobileOutlined />
                            )}
                            <span>
                              {method.nickname ||
                                (method.type === "card"
                                  ? `Card ending ${method.cardLast4}`
                                  : `${method.provider} ${method.phoneNumber}`)}
                            </span>
                          </Space>
                        </Option>
                      ))}
                    </Select.OptGroup>
                  )}
                </Select>
              </Form.Item>

              {/* Conditional Fields for Manual Mobile Money */}
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) =>
                  prev.paymentMethod !== curr.paymentMethod
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue("paymentMethod") === "mobile_money" ? (
                    <div className="space-y-4">
                      <Form.Item
                        label="Customer Phone Number"
                        name="phoneNumber"
                        rules={[{ required: true }]}
                        extra="For manual payment request"
                      >
                        <Input
                          prefix={<MobileOutlined />}
                          placeholder="252..."
                        />
                      </Form.Item>

                      {customerPaymentMethods.some(
                        (m) => m.type === "evc_plus" || m.type === "edahab",
                      ) && (
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                          <Text type="secondary" className="text-xs mb-2 block">
                            Quick Fill from Wallet:
                          </Text>
                          <div className="flex flex-wrap gap-2">
                            {customerPaymentMethods
                              .filter(
                                (m) =>
                                  m.type === "evc_plus" || m.type === "edahab",
                              )
                              .map((method) => (
                                <Tag
                                  key={method.$id}
                                  color="orange"
                                  className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                  onClick={() =>
                                    form.setFieldValue(
                                      "phoneNumber",
                                      method.phoneNumber,
                                    )
                                  }
                                >
                                  {method.provider === "evc_plus"
                                    ? "EVC"
                                    : "eDahab"}{" "}
                                  {method.phoneNumber}
                                </Tag>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null
                }
              </Form.Item>
            </Card>
          </div>

          {/* RIGHT COLUMN: Customer */}
          <div className="space-y-6">
            <Card title="Customer" className="shadow-sm">
              <Form.Item
                name="customerId"
                rules={[{ required: true, message: "Select a customer" }]}
                className="mb-4"
              >
                <CustomerSearchInput
                  onChange={(val) => {
                    setSelectedCustomer(val.details);
                    // form.setFieldsValue({ customerId: val.value }); // SearchInput handles value
                  }}
                />
              </Form.Item>

              {selectedCustomer && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {selectedCustomer.name?.[0]}
                    </div>
                    <div>
                      <div className="font-bold">{selectedCustomer.name}</div>
                      <div className="text-xs text-gray-500">
                        {selectedCustomer.email}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <div>User ID: {selectedCustomer.$id}</div>
                    <div>Phone: {selectedCustomer.phone || "Not set"}</div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="shadow-sm bg-blue-50 border-blue-100">
              <div className="flex justify-between items-center mb-4">
                <Text strong>Summary</Text>
                <Tag color="blue">Draft</Tag>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                Create Order
              </Button>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
