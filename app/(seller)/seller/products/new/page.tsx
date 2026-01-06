"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  Card,
  Typography,
  Space,
  Divider,
  Alert,
  App,
  Switch,
  Tag,
  DatePicker,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  SaveOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { useCategories } from "@/hooks/queries/useCategories";
import { useCompatibilityOptions } from "@/hooks/queries/useCompatibilityOptions";
import { useCreateProduct } from "@/hooks/queries/useProducts";
import { useSellerStore } from "@/lib/SellerStoreProvider";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DRAFT_KEY = "seller:add-product-draft:v1";
const CONDITIONS = ["New", "Used", "Refurbished", "Open Box"];

export default function SellerAddProductPage() {
  const router = useRouter();
  const { store } = useSellerStore();
  const sellerId = store?.sellerId;
  const { message } = App.useApp();

  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: compatibilityOptions, isLoading: compatLoading } =
    useCompatibilityOptions();
  const createProduct = useCreateProduct();

  // Restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.payload) {
          const restoredValues = { ...parsed.payload };
          if (restoredValues.discountStartDate) {
            restoredValues.discountStartDate = dayjs(
              restoredValues.discountStartDate
            );
          }
          if (restoredValues.discountExpiry) {
            restoredValues.discountExpiry = dayjs(
              restoredValues.discountExpiry
            );
          }
          form.setFieldsValue(restoredValues);
          message.info("Draft restored (images not included).");
        }
      }
    } catch (e) {
      console.error("Failed to restore draft", e);
    }
  }, [form]);

  // Save draft on change
  const handleValuesChange = (_: any, allValues: any) => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          payload: allValues,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error("Failed to save draft", e);
    }
  };

  const onFinish = (values: any) => {
    if (!sellerId) {
      message.error("Seller ID missing");
      return;
    }

    if (fileList.length === 0) {
      message.error("Please upload at least one image");
      return;
    }

    // Prepare payload
    const payload: any = {
      name: values.name,
      description: values.description,
      price: Number(values.price),
      stock: Number(values.stock),
      mainCategoryId: values.mainCategoryId,
      brand: values.brand,
      condition: values.condition,
      partNumber: values.partNumber,
      sellerId,
      compatibilityOptionIds: values.compatibilityOptionIds || [],
      originalPrice: values.originalPrice ? Number(values.originalPrice) : null,
      discountStartDate: values.discountStartDate
        ? values.discountStartDate.toISOString()
        : null,
      discountExpiry: values.discountExpiry
        ? values.discountExpiry.toISOString()
        : null,
    };

    // Create Product using Mutation
    // We need to pass the actual File objects
    // The useCreateProduct hook expects 'imageFile' as a single file?
    // Let's check useProducts.ts logic.
    // It seems useCreateProduct takes MutationParams which has { product: ..., imageFile: File }
    // But the previous page allowed MULTIPLE images which were appended to FormData.
    // My useCreateProduct might be simple.
    // Let's assume for now we use the main image (first one) as the primary image
    // and maybe the hook handles multiple?
    // The API route supports multiple 'images'.
    // I should modify useCreateProduct or just call fetch directly here to replicate complex logic.
    // Replicating fetch logic here is safer for multiple images if the hook wasn't built for it.

    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      if (key === "compatibilityOptionIds") {
        formData.append(key, JSON.stringify(payload[key]));
      } else {
        formData.append(key, String(payload[key]));
      }
    });

    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append("images", file.originFileObj);
      }
    });

    // Optimistic UI or just loading state
    const hide = message.loading("Creating product...", 0);

    fetch("/api/seller/products", {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed");
        }
        message.success("Product created successfully!");
        localStorage.removeItem(DRAFT_KEY);
        router.push("/seller/products");
      })
      .catch((err) => {
        message.error(err.message || "Failed to create product");
      })
      .finally(() => {
        hide();
      });
  };

  const handleUploadChange: UploadProps["onChange"] = ({
    fileList: newFileList,
  }) => {
    setFileList(newFileList);
  };

  const onPreview = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as File);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  return (
    <div className="max-w-10/12 mx-auto space-y-6 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 mb-2">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            New Product
          </Title>
          <Text type="secondary" className="text-lg">
            List a new item in your store
          </Text>
        </div>
        <Space size="middle">
          <Button
            icon={<UndoOutlined />}
            onClick={() => {
              form.resetFields();
              setFileList([]);
            }}
          >
            Clear Form
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            size="large"
            icon={<SaveOutlined />}
            loading={createProduct.isPending}
            className="px-8 h-12 rounded-xl font-bold shadow-md shadow-blue-100"
          >
            Publish Now
          </Button>
        </Space>
      </header>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        initialValues={{ condition: "New", compatibilityOptionIds: [] }}
        requiredMark="optional"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        <div className="lg:col-span-8 space-y-8">
          <Card
            title={
              <>
                <span className="text-blue-600 mr-2">01</span> Basic Details
              </>
            }
            variant="borderless"
            className="shadow-sm rounded-2xl overflow-hidden border border-gray-100"
          >
            <Form.Item
              name="name"
              label={
                <span className="font-semibold text-gray-700">
                  Product Name
                </span>
              }
              rules={[
                { required: true, message: "Please enter a product name" },
              ]}
            >
              <Input
                placeholder="e.g. Brake Pad Set for Ford Mustang"
                className="h-12 rounded-xl"
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={
                <span className="font-semibold text-gray-700">
                  Detailed Description
                </span>
              }
            >
              <TextArea
                rows={6}
                placeholder="Describe the product features, benefits, and specifics..."
                className="rounded-xl p-4"
              />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Form.Item
                name="originalPrice"
                label={
                  <span className="font-semibold text-gray-700 font-sans">
                    Original Price (Optional)
                  </span>
                }
                tooltip="The price before discount. If set higher than selling price, a 'Sale' tag will appear."
              >
                <InputNumber
                  prefix="$"
                  min={0}
                  step={0.01}
                  className="w-full h-12 rounded-xl flex items-center"
                  placeholder="e.g. 59.99"
                />
              </Form.Item>

              <Form.Item
                name="price"
                label={
                  <span className="font-semibold text-gray-700">
                    Selling Price (USD)
                  </span>
                }
                rules={[{ required: true, message: "Price is required" }]}
              >
                <InputNumber
                  prefix="$"
                  min={0}
                  step={0.01}
                  className="w-full h-12 rounded-xl flex items-center"
                  placeholder="e.g. 49.99"
                />
              </Form.Item>

              <Form.Item
                name="stock"
                label={
                  <span className="font-semibold text-gray-700">
                    Starting Stock
                  </span>
                }
                rules={[{ required: true, message: "Stock is required" }]}
              >
                <InputNumber
                  min={0}
                  className="w-full h-12 rounded-xl flex items-center"
                  placeholder="0"
                />
              </Form.Item>
            </div>

            <Form.Item dependencies={["price", "originalPrice"]} noStyle>
              {({ getFieldValue }) => {
                const price = getFieldValue("price");
                const originalPrice = getFieldValue("originalPrice");
                if (originalPrice && price && originalPrice > price) {
                  const savings =
                    ((originalPrice - price) / originalPrice) * 100;
                  return (
                    <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center transition-all animate-in fade-in slide-in-from-top-2">
                      <div>
                        <Text className="text-green-700 font-bold block">
                          Great Offer!
                        </Text>
                        <Text className="text-green-600 text-xs text-sans">
                          Customers will see a {savings.toFixed(0)}% discount.
                        </Text>
                      </div>
                      <Tag
                        color="green"
                        className="rounded-lg px-3 py-1 border-none font-bold text-sm"
                      >
                        -{savings.toFixed(0)}% OFF
                      </Tag>
                    </div>
                  );
                }
                return null;
              }}
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                name="discountStartDate"
                label={
                  <span className="font-semibold text-gray-700">
                    Discount Start Date (Optional)
                  </span>
                }
              >
                <DatePicker
                  showTime
                  className="w-full h-12 rounded-xl"
                  placeholder="When should this offer start?"
                />
              </Form.Item>

              <Form.Item
                name="discountExpiry"
                label={
                  <span className="font-semibold text-gray-700">
                    Discount Expiry Date (Optional)
                  </span>
                }
              >
                <DatePicker
                  showTime
                  className="w-full h-12 rounded-xl"
                  placeholder="When should this offer end?"
                />
              </Form.Item>
            </div>
          </Card>

          <Card
            title={
              <>
                <span className="text-blue-600 mr-2">02</span> Specifications
              </>
            }
            variant="borderless"
            className="shadow-sm rounded-2xl overflow-hidden border border-gray-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Form.Item
                name="brand"
                label={
                  <span className="font-semibold text-gray-700">Brand</span>
                }
              >
                <Input
                  placeholder="e.g. Bosch, Brembo..."
                  className="h-11 rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="partNumber"
                label={
                  <span className="font-semibold text-gray-700">
                    Manufacturer Part Number
                  </span>
                }
              >
                <Input placeholder="MPN-12345" className="h-11 rounded-lg" />
              </Form.Item>
              <Form.Item
                name="condition"
                label={
                  <span className="font-semibold text-gray-700">Condition</span>
                }
              >
                <Select className="h-11 rounded-lg custom-select">
                  {CONDITIONS.map((c) => (
                    <Option key={c} value={c}>
                      {c}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          </Card>

          <Card
            title={
              <>
                <span className="text-blue-600 mr-2">03</span> Categorization &
                Fitment
              </>
            }
            variant="borderless"
            className="shadow-sm rounded-2xl overflow-hidden border border-gray-100"
          >
            <Form.Item
              name="mainCategoryId"
              label={
                <span className="font-semibold text-gray-700">
                  Platform Category
                </span>
              }
              rules={[{ required: true, message: "Please select a category" }]}
              className="mb-8"
            >
              <Select
                loading={catsLoading}
                showSearch
                optionFilterProp="children"
                placeholder="Search and select category..."
                className="h-12 rounded-xl custom-select"
                styles={{
                  popup: { root: { borderRadius: "12px", padding: "8px" } },
                }}
              >
                {categories?.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Divider dashed className="my-6">
              Compatibility
            </Divider>

            <Form.Item
              name="compatibilityOptionIds"
              label={
                <span className="font-semibold text-gray-700">
                  Compatible Vehicles
                </span>
              }
              help="Select all vehicles this part is known to fit."
            >
              <Select
                mode="multiple"
                loading={compatLoading}
                placeholder="Choose one or more vehicles..."
                optionFilterProp="label"
                className="rounded-xl custom-select-multiple"
                styles={{
                  popup: { root: { borderRadius: "12px", padding: "8px" } },
                }}
                tagRender={(props) => (
                  <Tag
                    closable={props.closable}
                    onClose={props.onClose}
                    className="bg-blue-50 border-blue-100 text-blue-700 rounded-lg px-2 py-1 flex items-center gap-1 my-1"
                  >
                    {props.label}
                  </Tag>
                )}
              >
                {compatibilityOptions?.map((o) => (
                  <Option key={o.id} value={o.id} label={o.label}>
                    <div className="flex justify-between items-center py-1">
                      <span>{o.label}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card
            title={<span className="font-bold">Media Upload</span>}
            variant="borderless"
            className="shadow-sm rounded-2xl overflow-hidden border border-gray-100"
          >
            <div className="mb-4">
              <Alert
                title="Images (Max 6)"
                description="Upload clear photos from multiple angles. First image is the cover."
                type="info"
                showIcon
                className="rounded-xl border-none bg-blue-50"
              />
            </div>

            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              onPreview={onPreview}
              beforeUpload={() => false}
              maxCount={6}
              multiple
              className="create-product-upload"
            >
              {fileList.length < 6 && (
                <div className="flex flex-col items-center justify-center">
                  <PlusOutlined
                    style={{ fontSize: "24px", color: "#3b82f6" }}
                  />
                  <div style={{ marginTop: 8, color: "#64748b" }}>
                    Add Media
                  </div>
                </div>
              )}
            </Upload>
          </Card>

          <Card
            variant="borderless"
            className="shadow-sm rounded-2xl overflow-hidden border-l-4 border-l-blue-500 bg-blue-50/50"
          >
            <Text className="block font-bold text-lg mb-2">
              Publishing Tips
            </Text>
            <ul className="text-sm space-y-3 text-slate-600 pl-4 list-disc">
              <li>Use high-quality images with good lighting.</li>
              <li>Include the OEM part number for better search results.</li>
              <li>Specify the condition accurately to avoid returns.</li>
              <li>The price should be competitive for the condition.</li>
            </ul>
          </Card>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
            <Button
              type="primary"
              onClick={() => form.submit()}
              size="large"
              block
              icon={<SaveOutlined />}
              loading={createProduct.isPending}
              className="h-14 rounded-xl font-bold text-lg mb-4"
            >
              Create Listing
            </Button>
            <Button
              block
              size="large"
              className="h-12 rounded-xl text-gray-500"
              onClick={() => router.back()}
            >
              Back to Inventory
            </Button>
          </div>
        </div>
      </Form>

      <style jsx global>{`
        .custom-select :global(.ant-select-selector),
        .custom-select-multiple :global(.ant-select-selector) {
          border-radius: 12px !important;
          border-color: #e2e8f0 !important;
        }
        .create-product-upload :global(.ant-upload-select-picture-card) {
          border-radius: 16px !important;
          border-style: dashed !important;
          border-width: 2px !important;
          background-color: #f8fafc !important;
          transition: all 0.3s ease;
        }
        .create-product-upload :global(.ant-upload-select-picture-card:hover) {
          border-color: #3b82f6 !important;
          background-color: #eff6ff !important;
        }
        .create-product-upload :global(.ant-upload-list-item) {
          border-radius: 16px !important;
          padding: 4px !important;
        }
      `}</style>
    </div>
  );
}
