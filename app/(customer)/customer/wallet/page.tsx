"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import TypographyMUI from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { BreadcrumbTrail } from "@/components/ui/BreadcrumbTrail";

import {
  Card,
  Typography,
  Button,
  Tag,
  Popconfirm,
  Empty,
  App,
  Space,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  WalletOutlined,
  CreditCardOutlined,
  MobileOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AddPaymentMethodModal from "@/components/payment/AddPaymentMethodModal";

const { Title, Text } = Typography;

export default function WalletPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { message: messageApi } = App.useApp();
  const queryClient = useQueryClient();

  // Fetch Payment Methods
  const { data, isLoading } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      const res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error("Failed to fetch wallet");
      return res.json();
    },
  });

  const paymentMethods = data?.paymentMethods || [];

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete method");
      return res.json();
    },
    onSuccess: () => {
      messageApi.success("Payment method removed");
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: (err) => {
      messageApi.error(err.message);
    },
  });

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 }, maxWidth: 1200, margin: "0 auto" }}>
      <Box sx={{ mb: 4 }}>
        <BreadcrumbTrail
          items={[
            { label: "Home", href: "/" },
            { label: "Account", href: "/account" },
            { label: "Wallet" },
          ]}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 4,
        }}
      >
        <Stack spacing={1}>
          <TypographyMUI variant="h4" fontWeight={800} color="slate.900">
            My Wallet
          </TypographyMUI>
          <TypographyMUI variant="body1" color="text.secondary">
            Manage your saved payment methods securely.
          </TypographyMUI>
        </Stack>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalOpen(true)}
          size="large"
        >
          Add Payment Method
        </Button>
      </Box>

      <div className="space-y-6">
        {/* Keeping inner content div for now, but wrapped in MUI container */}

        <Card loading={isLoading} className="min-h-[400px]">
          {paymentMethods.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No saved payment methods"
            >
              <Button type="dashed" onClick={() => setIsAddModalOpen(true)}>
                Add your first method
              </Button>
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              {paymentMethods.map((item: any) => (
                <div
                  key={item.$id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        item.type === "card"
                          ? "bg-blue-50 text-blue-500"
                          : "bg-orange-50 text-orange-500"
                      }`}
                    >
                      {item.type === "card" ? (
                        <CreditCardOutlined className="text-xl" />
                      ) : (
                        <MobileOutlined className="text-xl" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Text strong>
                          {item.nickname ||
                            (item.type === "card"
                              ? "Credit Card"
                              : "Mobile Money")}
                        </Text>
                        {item.isDefault && <Tag color="green">Default</Tag>}
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        {item.type === "card" ? (
                          <Text type="secondary">
                            {item.cardBrand?.toUpperCase()} ending in ****{" "}
                            {item.cardLast4} | Exp: {item.cardExpiry}
                          </Text>
                        ) : (
                          <Space>
                            <Tag>
                              {item.provider === "evc_plus"
                                ? "EVC Plus"
                                : "eDahab"}
                            </Tag>
                            <Text>{item.phoneNumber}</Text>
                          </Space>
                        )}
                      </div>
                    </div>
                  </div>

                  <Popconfirm
                    title="Remove this method?"
                    onConfirm={() => deleteMutation.mutate(item.$id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <AddPaymentMethodModal
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
        }}
      />
    </Box>
  );
}
