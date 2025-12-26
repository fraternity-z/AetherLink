/**
 * 图像生成模型标签组件
 */

import React from 'react';
import { Image } from 'lucide-react';
import CustomTag, { type CustomTagProps } from './CustomTag';

interface ImageGenTagProps extends Omit<CustomTagProps, 'icon' | 'color'> {
  showTooltip?: boolean;
  showLabel?: boolean;
}

export const ImageGenTag: React.FC<ImageGenTagProps> = ({
  size = 14,
  showTooltip = true,
  showLabel = false,
  ...restProps
}) => {
  return (
    <CustomTag
      size={size}
      color="#eb2f96"
      icon={<Image size={size} />}
      tooltip={showTooltip ? '图像生成' : undefined}
      {...restProps}
    >
      {showLabel ? '图像' : ''}
    </CustomTag>
  );
};

export default ImageGenTag;
