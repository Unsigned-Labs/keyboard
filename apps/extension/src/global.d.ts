// Allow importing images in TypeScript (webpack will handle these at build time)
declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

// Allow importing CSS modules (if any)
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
