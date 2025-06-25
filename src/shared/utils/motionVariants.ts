/**
 * Motion动画变体配置
 * 用于统一管理项目中的动画效果
 */

// 灯泡思考动画变体 - 参考电脑版Cherry Studio
export const lightbulbVariants = {
  active: {
    opacity: [1, 0.3, 1],
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.2,
      ease: "easeInOut",
      times: [0, 0.5, 1],
      repeat: Infinity
    }
  },
  idle: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

// 思考点动画变体 - 用于dots样式
export const thinkingDotsVariants = {
  animate: {
    scale: [0, 1, 0],
    transition: {
      duration: 1.4,
      ease: 'easeInOut',
      repeat: Infinity
    }
  },
  idle: {
    scale: 0,
    transition: {
      duration: 0.2
    }
  }
};

// 思考容器动画变体
export const thinkingContainerVariants = {
  thinking: {
    backgroundColor: ['rgba(255, 193, 7, 0.1)', 'rgba(255, 193, 7, 0.2)', 'rgba(255, 193, 7, 0.1)'],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity
    }
  },
  idle: {
    backgroundColor: 'transparent',
    transition: {
      duration: 0.3
    }
  }
};

// 脉冲动画变体 - 用于timeline样式的圆点
export const pulseVariants = {
  active: {
    scale: [1, 1.3, 1],
    boxShadow: [
      '0 0 0 0 rgba(255, 193, 7, 0.7)',
      '0 0 0 10px rgba(255, 193, 7, 0)',
      '0 0 0 0 rgba(255, 193, 7, 0)'
    ],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity
    }
  },
  idle: {
    scale: 1,
    boxShadow: '0 0 0 0 rgba(255, 193, 7, 0)',
    transition: {
      duration: 0.3
    }
  }
};

// 发光动画变体 - 用于card样式
export const glowVariants = {
  active: {
    boxShadow: [
      '0 0 5px rgba(255, 193, 7, 0.5)',
      '0 0 20px rgba(255, 193, 7, 0.8)',
      '0 0 5px rgba(255, 193, 7, 0.5)'
    ],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity
    }
  },
  idle: {
    boxShadow: '0 0 5px rgba(255, 193, 7, 0.2)',
    transition: {
      duration: 0.3
    }
  }
};

// 弹跳动画变体 - 用于dots样式的小点
export const bounceVariants = {
  animate: (delay: number) => ({
    scale: [0, 1, 0],
    transition: {
      duration: 1.4,
      ease: 'easeInOut',
      repeat: Infinity,
      delay
    }
  }),
  idle: {
    scale: 0,
    transition: {
      duration: 0.2
    }
  }
};
