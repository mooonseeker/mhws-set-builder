/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // 注意：响应式断点现在在 src/index.css 中使用 @theme 规则定义
      // 方向断点保留在配置中
      screens: {
        portrait: { raw: "(orientation: portrait)" },
        landscape: { raw: "(orientation: landscape)" },
        "mobile-landscape": {
          raw: "(max-width: 767px) and (orientation: landscape)",
        },
      },

      // 间距配置 - 扩展默认间距值
      spacing: {
        // 基础间距 (默认值)
        1: "0.25rem", // 4px
        2: "0.5rem", // 8px
        3: "0.75rem", // 12px
        4: "1rem", // 16px
        5: "1.25rem", // 20px
        6: "1.5rem", // 24px
        7: "1.75rem", // 28px
        8: "2rem", // 32px
        9: "2.25rem", // 36px
        10: "2.5rem", // 40px
        11: "2.75rem", // 44px
        12: "3rem", // 48px
        14: "3.5rem", // 56px
        16: "4rem", // 64px
        20: "5rem", // 80px
        24: "6rem", // 96px
        28: "7rem", // 112px
        32: "8rem", // 128px
        36: "9rem", // 144px
        40: "10rem", // 160px
        44: "11rem", // 176px
        48: "12rem", // 192px
        52: "13rem", // 208px
        56: "14rem", // 224px
        60: "15rem", // 240px
        64: "16rem", // 256px
        72: "18rem", // 288px
        80: "20rem", // 320px
        96: "24rem", // 384px

        // 小间距扩展 (2px, 6px, 10px)
        0.5: "0.125rem",
        1.5: "0.375rem",
        2.5: "0.625rem",

        // 大间距扩展 (72px-168px)
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
        34: "8.5rem",
        38: "9.5rem",
        42: "10.5rem",
      },

      // 容器最大宽度
      maxWidth: {
        container: "1400px",
        content: "1200px",
        narrow: "800px",
        wide: "1600px",
      },

      // 扩展字体大小
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },

      // 自定义阴影
      boxShadow: {
        "sm-light": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "md-light":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
};
