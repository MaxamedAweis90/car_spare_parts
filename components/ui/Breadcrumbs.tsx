"use client";

import { Breadcrumb } from "antd";
import Link from "next/link";
import { HomeOutlined } from "@ant-design/icons";

export interface BreadcrumbItem {
  title: string | React.ReactNode;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const breadcrumbItems = [
    {
      title: (
        <Link href="/" className="flex items-center gap-1">
          <HomeOutlined />
          <span>Home</span>
        </Link>
      ),
    },
    ...items.map((item) => ({
      title: item.href ? (
        <Link href={item.href}>{item.title}</Link>
      ) : (
        item.title
      ),
    })),
  ];

  return (
    <div className="mb-6 flex animate-in fade-in slide-in-from-top-2 duration-700">
      <Breadcrumb
        items={breadcrumbItems}
        className="text-sm font-semibold text-slate-500"
      />
    </div>
  );
}

