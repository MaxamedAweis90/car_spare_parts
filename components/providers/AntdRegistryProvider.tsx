"use client";

import React from "react";
import {
  createCache,
  extractStyle,
  StyleProvider,
} from "@ant-design/cssinjs/lib";
import type Entity from "@ant-design/cssinjs/lib/Cache";
import { useServerInsertedHTML } from "next/navigation";

// Note: If using @ant-design/nextjs-registry, we can use that instead.
// But manual implementation is robust if the package has issues.
// Let's use the official registry package way if possible, which is cleaner.
// Actually, I will use the package I installed: @ant-design/nextjs-registry

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import theme from "../../theme/themeConfig"; // I'll check if this exists or create it

const StyledComponentsRegistry = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
};

export default StyledComponentsRegistry;
