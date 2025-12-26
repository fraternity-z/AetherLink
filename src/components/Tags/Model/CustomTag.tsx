/**
 * 自定义标签基础组件
 * 从 Cherry Studio 移植并适配 AetherLink
 */

import React from 'react';

export interface CustomTagProps {
  size?: number;
  color?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const CustomTag: React.FC<CustomTagProps> = ({
  size = 14,
  color = '#1890ff',
  icon,
  tooltip,
  children,
  className = '',
  style = {}
}) => {
  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: children ? '2px 6px' : '2px 4px',
    borderRadius: '4px',
    backgroundColor: `${color}20`,
    color: color,
    fontSize: `${size}px`,
    lineHeight: 1,
    ...style
  };

  const tag = (
    <span className={`model-tag ${className}`} style={tagStyle}>
      {icon}
      {children}
    </span>
  );

  if (tooltip) {
    return (
      <span title={tooltip}>
        {tag}
      </span>
    );
  }

  return tag;
};

export default CustomTag;
