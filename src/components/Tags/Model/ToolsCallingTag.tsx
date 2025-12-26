/**
 * 工具调用模型标签组件
 */

import React from 'react';
import { Wrench } from 'lucide-react';
import CustomTag, { type CustomTagProps } from './CustomTag';

interface ToolsCallingTagProps extends Omit<CustomTagProps, 'icon' | 'color'> {
  showTooltip?: boolean;
  showLabel?: boolean;
}

export const ToolsCallingTag: React.FC<ToolsCallingTagProps> = ({
  size = 14,
  showTooltip = true,
  showLabel = false,
  ...restProps
}) => {
  return (
    <CustomTag
      size={size}
      color="#fa8c16"
      icon={<Wrench size={size} />}
      tooltip={showTooltip ? '工具调用' : undefined}
      {...restProps}
    >
      {showLabel ? '工具' : ''}
    </CustomTag>
  );
};

export default ToolsCallingTag;
