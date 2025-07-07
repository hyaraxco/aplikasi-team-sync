import React from "react";
// Jika sudah pakai next-themes, bisa import useTheme
// import { useTheme } from "next-themes";

interface LogoProps {
  isCollapsed?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  isCollapsed = false,
  className = "",
}) => {
  // Untuk future: bisa pakai useTheme() untuk deteksi mode
  // const { theme } = useTheme();
  // const logoSrc = theme === "dark" ? "/team-sync-darkmode.png" : "/team-sync-lightmode.png";

  // Untuk sekarang, pakai className dark: untuk ganti gambar
  return (
    <>
      <img
        src="/team-sync-lightmode.png"
        className={`h-6 w-6 object-contain dark:hidden ${className}`}
        alt="Team Sync Logo"
      />
      <img
        src="/team-sync-darkmode.png"
        className={`h-6 w-6 object-contain hidden dark:block ${className}`}
        alt="Team Sync Logo Dark"
      />
    </>
  );
};
