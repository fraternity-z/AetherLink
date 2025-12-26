/**
 * 重排序模型标签组件
 */

import React from 'react';
import { ListOrdered } from 'lucide-react';
import CustomTag, { type CustomTagProps } from './CustomTag';

interface RerankerTagProps extends Omit<CustomTagProps, 'icon' | 'color'> {
  showTooltip?: boolean;
  showLabel?: boolean;
}

export const RerankerTag: React.FC<RerankerTagProps> = ({
  size = 14,
  showTooltip = true,
  showLabel = false,
  ...restProps
}) => {
  return (
    <CustomTag
      size={size}
      color="#52c41a"
      icon={<ListOrdered size={size} />}
      tooltip={showTooltip ? '重排序模型' : undefined}
      {...restProps}
    >
      {showLabel ? '重排序' : ''}
    </CustomTag>
  );
};

export default RerankerTag;
