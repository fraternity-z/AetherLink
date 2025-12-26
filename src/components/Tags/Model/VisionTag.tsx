/**
 * 视觉模型标签组件
 */

import React from 'react';
import { Eye } from 'lucide-react';
import CustomTag, { type CustomTagProps } from './CustomTag';

interface VisionTagProps extends Omit<CustomTagProps, 'icon' | 'color'> {
  showTooltip?: boolean;
  showLabel?: boolean;
}

export const VisionTag: React.FC<VisionTagProps> = ({
  size = 14,
  showTooltip = true,
  showLabel = false,
  ...restProps
}) => {
  return (
    <CustomTag
      size={size}
      color="#00b96b"
      icon={<Eye size={size} />}
      tooltip={showTooltip ? '视觉模型' : undefined}
      {...restProps}
    >
      {showLabel ? '视觉' : ''}
    </CustomTag>
  );
};

export default VisionTag;
