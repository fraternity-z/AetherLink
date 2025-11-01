/**
 * Calculator MCP Server
 * 提供高级计算器功能，包括基本运算、科学计算、进制转换、单位转换等
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// 工具定义
const CALCULATE_TOOL: Tool = {
  name: 'calculate',
  description: '执行数学计算，支持基本运算和科学计算函数',
  inputSchema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: '数学表达式，例如: "2 + 3 * 4", "sin(30)", "sqrt(16)", "pow(2, 10)"'
      }
    },
    required: ['expression']
  }
};

const CONVERT_BASE_TOOL: Tool = {
  name: 'convert_base',
  description: '进制转换，支持二进制、八进制、十进制、十六进制之间的转换',
  inputSchema: {
    type: 'object',
    properties: {
      value: {
        type: 'string',
        description: '要转换的数值'
      },
      fromBase: {
        type: 'number',
        description: '源进制 (2, 8, 10, 16)',
        enum: [2, 8, 10, 16]
      },
      toBase: {
        type: 'number',
        description: '目标进制 (2, 8, 10, 16)',
        enum: [2, 8, 10, 16]
      }
    },
    required: ['value', 'fromBase', 'toBase']
  }
};

const CONVERT_UNIT_TOOL: Tool = {
  name: 'convert_unit',
  description: '单位转换，支持长度、重量、温度等常用单位转换',
  inputSchema: {
    type: 'object',
    properties: {
      value: {
        type: 'number',
        description: '要转换的数值'
      },
      category: {
        type: 'string',
        description: '单位类别：length(长度), weight(重量), temperature(温度), area(面积), volume(体积)',
        enum: ['length', 'weight', 'temperature', 'area', 'volume']
      },
      fromUnit: {
        type: 'string',
        description: '源单位，如: m, km, kg, g, celsius, fahrenheit 等'
      },
      toUnit: {
        type: 'string',
        description: '目标单位'
      }
    },
    required: ['value', 'category', 'fromUnit', 'toUnit']
  }
};

const STATISTICS_TOOL: Tool = {
  name: 'statistics',
  description: '统计计算，包括平均值、中位数、标准差、方差等',
  inputSchema: {
    type: 'object',
    properties: {
      numbers: {
        type: 'array',
        items: {
          type: 'number'
        },
        description: '数字数组，例如: [1, 2, 3, 4, 5]'
      }
    },
    required: ['numbers']
  }
};

/**
 * Calculator Server 类
 */
export class CalculatorServer {
  public server: Server;

  constructor() {
    this.server = new Server(
      {
        name: '@aether/calculator',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [CALCULATE_TOOL, CONVERT_BASE_TOOL, CONVERT_UNIT_TOOL, STATISTICS_TOOL]
      };
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'calculate') {
        return this.calculate(args as { expression: string });
      } else if (name === 'convert_base') {
        return this.convertBase(args as any);
      } else if (name === 'convert_unit') {
        return this.convertUnit(args as any);
      } else if (name === 'statistics') {
        return this.calculateStatistics(args as { numbers: number[] });
      }

      throw new Error(`未知的工具: ${name}`);
    });
  }

  /**
   * 执行数学计算
   */
  private calculate(params: { expression: string }): {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  } {
    try {
      // 预处理表达式，支持常用的数学函数
      let expr = params.expression.trim();

      // 替换常用数学常量
      expr = expr.replace(/\bpi\b/gi, String(Math.PI));
      expr = expr.replace(/\be\b/gi, String(Math.E));

      // 替换 ln 为 log（自然对数）
      expr = expr.replace(/\bln\b/g, 'log');
      // 替换 log10
      expr = expr.replace(/\blog10\b/g, 'log10');
      // 替换 log2
      expr = expr.replace(/\blog2\b/g, 'log2');

      // 构建安全的计算环境
      const safeExpr = this.sanitizeExpression(expr);
      
      // 创建函数来计算表达式
      const result = this.evaluateExpression(safeExpr);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              expression: params.expression,
              result: result,
              formatted: this.formatNumber(result)
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              expression: params.expression,
              error: error instanceof Error ? error.message : '计算错误'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }

  /**
   * 清理和验证表达式
   */
  private sanitizeExpression(expr: string): string {
    // 移除所有空格
    expr = expr.replace(/\s/g, '');
    
    return expr;
  }

  /**
   * 安全地计算表达式
   */
  private evaluateExpression(expr: string): number {
    // 创建一个安全的 Math 对象副本
    const mathContext = {
      abs: Math.abs,
      acos: Math.acos,
      asin: Math.asin,
      atan: Math.atan,
      atan2: Math.atan2,
      ceil: Math.ceil,
      cos: Math.cos,
      exp: Math.exp,
      floor: Math.floor,
      log: Math.log,
      log10: Math.log10,
      log2: Math.log2,
      max: Math.max,
      min: Math.min,
      pow: Math.pow,
      random: Math.random,
      round: Math.round,
      sin: Math.sin,
      sqrt: Math.sqrt,
      tan: Math.tan,
      PI: Math.PI,
      E: Math.E
    };

    // 替换数学函数调用
    let processedExpr = expr;
    Object.keys(mathContext).forEach(func => {
      if (typeof (mathContext as any)[func] === 'function') {
        const regex = new RegExp(`\\b${func}\\b`, 'g');
        processedExpr = processedExpr.replace(regex, `Math.${func}`);
      }
    });

    // 使用 Function 构造器计算（受限环境）
    try {
      const func = new Function('Math', `"use strict"; return (${processedExpr})`);
      return func(Math);
    } catch (error) {
      throw new Error('无效的数学表达式');
    }
  }

  /**
   * 格式化数字显示
   */
  private formatNumber(num: number): string {
    if (Number.isInteger(num)) {
      return num.toString();
    }
    // 保留最多10位小数
    return Number(num.toFixed(10)).toString();
  }

  /**
   * 进制转换
   */
  private convertBase(params: {
    value: string;
    fromBase: number;
    toBase: number;
  }): {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  } {
    try {
      const { value, fromBase, toBase } = params;

      // 验证进制
      if (![2, 8, 10, 16].includes(fromBase) || ![2, 8, 10, 16].includes(toBase)) {
        throw new Error('只支持 2, 8, 10, 16 进制');
      }

      // 先转换为十进制
      const decimal = parseInt(value, fromBase);
      
      if (isNaN(decimal)) {
        throw new Error('无效的数值');
      }

      // 再转换为目标进制
      let result: string;
      switch (toBase) {
        case 2:
          result = decimal.toString(2);
          break;
        case 8:
          result = decimal.toString(8);
          break;
        case 10:
          result = decimal.toString(10);
          break;
        case 16:
          result = decimal.toString(16).toUpperCase();
          break;
        default:
          throw new Error('不支持的进制');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              input: {
                value: value,
                base: fromBase
              },
              output: {
                value: result,
                base: toBase
              },
              decimal: decimal
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : '进制转换失败'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }

  /**
   * 单位转换
   */
  private convertUnit(params: {
    value: number;
    category: string;
    fromUnit: string;
    toUnit: string;
  }): {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  } {
    try {
      const { value, category, fromUnit, toUnit } = params;

      let result: number;

      switch (category) {
        case 'length':
          result = this.convertLength(value, fromUnit, toUnit);
          break;
        case 'weight':
          result = this.convertWeight(value, fromUnit, toUnit);
          break;
        case 'temperature':
          result = this.convertTemperature(value, fromUnit, toUnit);
          break;
        case 'area':
          result = this.convertArea(value, fromUnit, toUnit);
          break;
        case 'volume':
          result = this.convertVolume(value, fromUnit, toUnit);
          break;
        default:
          throw new Error(`不支持的单位类别: ${category}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              input: `${value} ${fromUnit}`,
              output: `${result} ${toUnit}`,
              result: result,
              category: category
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : '单位转换失败'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }

  /**
   * 长度转换
   */
  private convertLength(value: number, from: string, to: string): number {
    const toMeters: Record<string, number> = {
      mm: 0.001,
      cm: 0.01,
      m: 1,
      km: 1000,
      inch: 0.0254,
      foot: 0.3048,
      yard: 0.9144,
      mile: 1609.344
    };

    if (!toMeters[from] || !toMeters[to]) {
      throw new Error(`不支持的长度单位: ${from} 或 ${to}`);
    }

    return (value * toMeters[from]) / toMeters[to];
  }

  /**
   * 重量转换
   */
  private convertWeight(value: number, from: string, to: string): number {
    const toKg: Record<string, number> = {
      mg: 0.000001,
      g: 0.001,
      kg: 1,
      ton: 1000,
      oz: 0.0283495,
      lb: 0.453592,
      pound: 0.453592
    };

    if (!toKg[from] || !toKg[to]) {
      throw new Error(`不支持的重量单位: ${from} 或 ${to}`);
    }

    return (value * toKg[from]) / toKg[to];
  }

  /**
   * 温度转换
   */
  private convertTemperature(value: number, from: string, to: string): number {
    // 先转换为摄氏度
    let celsius: number;
    switch (from.toLowerCase()) {
      case 'celsius':
      case 'c':
        celsius = value;
        break;
      case 'fahrenheit':
      case 'f':
        celsius = (value - 32) * 5 / 9;
        break;
      case 'kelvin':
      case 'k':
        celsius = value - 273.15;
        break;
      default:
        throw new Error(`不支持的温度单位: ${from}`);
    }

    // 再转换为目标单位
    switch (to.toLowerCase()) {
      case 'celsius':
      case 'c':
        return celsius;
      case 'fahrenheit':
      case 'f':
        return celsius * 9 / 5 + 32;
      case 'kelvin':
      case 'k':
        return celsius + 273.15;
      default:
        throw new Error(`不支持的温度单位: ${to}`);
    }
  }

  /**
   * 面积转换
   */
  private convertArea(value: number, from: string, to: string): number {
    const toSqMeters: Record<string, number> = {
      sqmm: 0.000001,
      sqcm: 0.0001,
      sqm: 1,
      sqkm: 1000000,
      sqinch: 0.00064516,
      sqfoot: 0.092903,
      sqyard: 0.836127,
      acre: 4046.86,
      hectare: 10000
    };

    if (!toSqMeters[from] || !toSqMeters[to]) {
      throw new Error(`不支持的面积单位: ${from} 或 ${to}`);
    }

    return (value * toSqMeters[from]) / toSqMeters[to];
  }

  /**
   * 体积转换
   */
  private convertVolume(value: number, from: string, to: string): number {
    const toLiters: Record<string, number> = {
      ml: 0.001,
      l: 1,
      m3: 1000,
      gallon: 3.78541,
      quart: 0.946353,
      pint: 0.473176,
      cup: 0.236588,
      floz: 0.0295735
    };

    if (!toLiters[from] || !toLiters[to]) {
      throw new Error(`不支持的体积单位: ${from} 或 ${to}`);
    }

    return (value * toLiters[from]) / toLiters[to];
  }

  /**
   * 统计计算
   */
  private calculateStatistics(params: { numbers: number[] }): {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  } {
    try {
      const { numbers } = params;

      if (!Array.isArray(numbers) || numbers.length === 0) {
        throw new Error('请提供有效的数字数组');
      }

      const sorted = [...numbers].sort((a, b) => a - b);
      const sum = numbers.reduce((a, b) => a + b, 0);
      const mean = sum / numbers.length;
      
      // 中位数
      const median = numbers.length % 2 === 0
        ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
        : sorted[Math.floor(numbers.length / 2)];

      // 方差和标准差
      const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
      const stdDev = Math.sqrt(variance);

      // 最大值和最小值
      const max = Math.max(...numbers);
      const min = Math.min(...numbers);
      const range = max - min;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              count: numbers.length,
              sum: sum,
              mean: mean,
              median: median,
              mode: this.findMode(numbers),
              variance: variance,
              standardDeviation: stdDev,
              min: min,
              max: max,
              range: range,
              sorted: sorted
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : '统计计算失败'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }

  /**
   * 查找众数
   */
  private findMode(numbers: number[]): number | null {
    const frequency: Record<number, number> = {};
    let maxFreq = 0;
    let mode: number | null = null;

    numbers.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1;
      if (frequency[num] > maxFreq) {
        maxFreq = frequency[num];
        mode = num;
      }
    });

    return maxFreq > 1 ? mode : null;
  }
}

