import type { Plugin } from 'unified';

/**
 * 自定义 remark 插件，用于禁用特定的 markdown 构造
 *
 * 此插件允许通过将特定的 markdown 构造作为 micromark 扩展传递给底层解析器来禁用它们。
 *
 * @see https://github.com/micromark/micromark
 *
 * @example
 * ```typescript
 * // 禁用缩进代码块
 * remarkDisableConstructs(['codeIndented'])
 *
 * // 禁用多个构造
 * remarkDisableConstructs(['codeIndented', 'autolink', 'htmlFlow'])
 * ```
 */

/**
 * 辅助函数，用于向插件数据添加值
 * @param data - 插件数据对象
 * @param field - 要添加到的字段名
 * @param value - 要添加的值
 */
function add(data: any, field: string, value: unknown): void {
  const list = data[field] ? data[field] : (data[field] = []);
  list.push(value);
}

/**
 * Remark 插件，用于禁用特定的 markdown 构造
 * @param constructs - 要禁用的构造名称数组（例如 ['codeIndented', 'autolink']）
 * @returns 一个 remark 插件函数
 */
function remarkDisableConstructs(constructs: string[] = []): Plugin<[], any, any> {
  return function () {
    const data = this.data();

    if (constructs.length > 0) {
      const disableExtension = {
        disable: {
          null: constructs
        }
      };

      add(data, 'micromarkExtensions', disableExtension);
    }
  };
}

export default remarkDisableConstructs;
