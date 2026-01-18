"use client";

import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import theme from "@/theme/themeConfig";

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

