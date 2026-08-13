import React from 'react';
import { Image } from 'react-native';

const SVG_STRING = 
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">` +
  `<rect x="7" y="7" width="15" height="15" rx="4" fill="#F05A28" />` +
  `<rect x="0" y="0" width="18" height="18" rx="5" fill="#000000" />` +
  `<rect x="2" y="2" width="14" height="14" rx="3" fill="#F05A28" />` +
  `</svg>`;

const SVG_B64 = 'data:image/svg+xml;base64,' + btoa(SVG_STRING);

interface PostIconProps {
  size?: number;
}

export function PostIcon({ size = 24 }: PostIconProps) {
  return (
    <Image
      source={{ uri: SVG_B64 }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
