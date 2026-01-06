import type { ThemeConfig } from "antd";

const theme: ThemeConfig = {
  token: {
    fontSize: 16,
    colorPrimary: "#52c41a", // Example primary color, verify with user preference or existing styles
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif", // Matching typical modern fonts
  },
  components: {
    Layout: {
      bodyBg: "#f5f5f5",
      headerBg: "#ffffff",
    },
    Table: {
      headerBg: "#fafafa",
    },
  },
};

export default theme;
