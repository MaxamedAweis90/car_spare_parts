// components/CDNs.tsx
"use client";

interface CDNsProps {
  isAdmin?: boolean;
}

export default function CDNs({ isAdmin = false }: CDNsProps) {
  return (
    <>
      {/* Font Awesome */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      {/* Swiper.js */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/Swiper/10.1.0/swiper-bundle.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/Swiper/10.1.0/swiper-bundle.min.js"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        defer
      ></script>

      {/* Chart.js (admin only) */}
      {isAdmin && (
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.3.0/chart.umd.min.js"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          defer
        ></script>
      )}
    </>
  );
}
