import React, { useRef, useCallback, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';

interface HueBarProps {
  hue: number; // 0-360
  onChange: (hue: number) => void;
  width?: number;
  height?: number;
  disabled?: boolean;
}

const HueBar: React.FC<HueBarProps> = ({
  hue,
  onChange,
  width = 280,
  height = 20,
  disabled = false
}) => {
  const theme = useTheme();
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // 计算色相值
  const calculateHue = useCallback((clientX: number): number => {
    if (!barRef.current) return hue;

    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newHue = Math.round((x / rect.width) * 360);
    return Math.max(0, Math.min(360, newHue));
  }, [hue]);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    isDragging.current = true;
    const newHue = calculateHue(e.clientX);
    onChange(newHue);
  }, [disabled, calculateHue, onChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || disabled) return;
    
    e.preventDefault();
    const newHue = calculateHue(e.clientX);
    onChange(newHue);
  }, [disabled, calculateHue, onChange]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    isDragging.current = true;
    const touch = e.touches[0];
    const newHue = calculateHue(touch.clientX);
    onChange(newHue);
  }, [disabled, calculateHue, onChange]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || disabled) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const newHue = calculateHue(touch.clientX);
    onChange(newHue);
  }, [disabled, calculateHue, onChange]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // 添加全局事件监听器
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();
    const handleGlobalTouchMove = (e: TouchEvent) => handleTouchMove(e);
    const handleGlobalTouchEnd = () => handleTouchEnd();

    if (isDragging.current) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // 计算滑块位置
  const sliderPosition = (hue / 360) * width;

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* 色相条背景 */}
      <Box
        ref={barRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 1,
          background: `linear-gradient(to right, 
            #ff0000 0%, 
            #ffff00 16.66%, 
            #00ff00 33.33%, 
            #00ffff 50%, 
            #0000ff 66.66%, 
            #ff00ff 83.33%, 
            #ff0000 100%
          )`,
          border: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* 滑块 */}
        {/* 🚀 性能优化：使用 transform: translateX 替代 left 动画，避免重排 */}
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: -6,
            width: 12,
            height: height + 4,
            backgroundColor: '#ffffff',
            border: `2px solid ${theme.palette.text.primary}`,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            cursor: disabled ? 'not-allowed' : 'grab',
            transform: `translateX(${sliderPosition}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
            willChange: 'transform',
            '&:active': {
              cursor: disabled ? 'not-allowed' : 'grabbing'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default HueBar;
