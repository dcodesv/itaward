import { Icon as IconifyIcon } from "@iconify/react";

type IconProps = {
  icon: string;
  className?: string;
  width?: number | string;
  height?: number | string;
};

export default function Icon({ icon, className = "", width = 20, height = 20 }: IconProps) {
  return (
    <IconifyIcon
      icon={icon}
      className={className}
      width={width}
      height={height}
    />
  );
}

