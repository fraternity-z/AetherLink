/**
 * 推理模型标签组件
 */

import React from 'react';
import { Brain } from 'lucide-react';
import CustomTag, { type CustomTagProps } from './CustomTag';

interface ReasoningTagProps extends Omit<CustomTagProps, 'icon' | 'color'> {
  showTooltip?: boolean;
  showLabel?: boolean;
}

export const ReasoningTag: React.FC<ReasoningTagProps> = ({
  size = 14,
  showTooltip = true,
  showLabel = false,
  ...restProps
}) => {
  return (
    <CustomTag
      size={size}
      color="#722ed1"
      icon={<Brain size={size} />}
      tooltip={showTooltip ? '推理模型' : undefined}
      {...restProps}
    >
      {showLabel ? '推理' : ''}
    </CustomTag>
  );
};

export default ReasoningTag;
