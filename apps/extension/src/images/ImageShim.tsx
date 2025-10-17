import React from "react";

type Props = {
  src: { src?: string } | string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
};

const ImageShim: React.FC<Props> = ({ src, alt, width, height, className }) => {
  // support import object {src: string} used by webpack
  const resolvedSrc = typeof src === "string" ? src : (src as any).src || "";
  return <img src={resolvedSrc} alt={alt} width={width} height={height} className={className} />;
};

export default ImageShim;
