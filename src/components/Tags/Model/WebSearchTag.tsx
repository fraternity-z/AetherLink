/**
 * 网页搜索模型标签组件
 */

import React from 'react';
import { Globe } from 'lucide-react';
import CustomTag, { type CustomTagProps } from './CustomTag';

interface WebSearchTagProps extends Omit<CustomTagProps, 'icon' | 'color'> {
  showTooltip?: boolean;
  showLabel?: boolean;
}

export const WebSearchTag: React.FC<WebSearchTagProps> = ({
  size = 14,
  showTooltip = true,
  showLabel = false,
  ...restProps
}) => {
  return (
    <CustomTag
      size={size}
      color="#1890ff"
      icon={<Globe size={size} />}
      tooltip={showTooltip ? '网页搜索' : undefined}
      {...restProps}
    >
      {showLabel ? '搜索' : ''}
    </CustomTag>
  );
};

export default WebSearchTag;
