/**
 * 嵌入模型标签组件
 */

import React from 'react';
import { Database } from 'lucide-react';
import CustomTag, { type CustomTagProps } from './CustomTag';

interface EmbeddingTagProps extends Omit<CustomTagProps, 'icon' | 'color'> {
  showTooltip?: boolean;
  showLabel?: boolean;
}

export const EmbeddingTag: React.FC<EmbeddingTagProps> = ({
  size = 14,
  showTooltip = true,
  showLabel = false,
  ...restProps
}) => {
  return (
    <CustomTag
      size={size}
      color="#13c2c2"
      icon={<Database size={size} />}
      tooltip={showTooltip ? '嵌入模型' : undefined}
      {...restProps}
    >
      {showLabel ? '嵌入' : ''}
    </CustomTag>
  );
};

export default EmbeddingTag;
