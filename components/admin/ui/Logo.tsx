import Image from "next/image";

const LOGO_PATH = "/images/logo.svg";

export function Logo({
  className,
  height = 32,
}: {
  className?: string;
  height?: number;
}) {
  const width = Math.round(height * (691 / 801));

  return (
    <Image
      src={LOGO_PATH}
      alt="GidTransfer"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
