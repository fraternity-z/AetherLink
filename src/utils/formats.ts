// 检查是否包含潜在的 LaTeX 模式
const containsLatexRegex = /\\\(.*?\\\)|\\\[.*?\\\]/s;

/**
 * 查找 LaTeX 数学公式的匹配括号对
 *
 * 使用平衡括号算法处理嵌套结构，正确识别转义字符
 *
 * @param text 要搜索的文本
 * @param openDelim 开始分隔符 (如 '\[' 或 '\(')
 * @param closeDelim 结束分隔符 (如 '\]' 或 '\)')
 * @returns 匹配结果对象或 null
 */
const findLatexMatch = (text: string, openDelim: string, closeDelim: string) => {
  // 统计连续反斜杠：奇数个表示转义，偶数个表示未转义
  const escaped = (i: number) => {
    let count = 0;
    while (--i >= 0 && text[i] === '\\') count++;
    return count & 1;
  };

  // 查找第一个有效的开始标记
  for (let i = 0, n = text.length; i <= n - openDelim.length; i++) {
    // 没有找到开始分隔符或被转义，跳过
    if (!text.startsWith(openDelim, i) || escaped(i)) continue;

    // 处理嵌套结构
    for (let j = i + openDelim.length, depth = 1; j <= n - closeDelim.length && depth; j++) {
      // 计算当前位置对深度的影响：+1(开始), -1(结束), 0(无关)
      const delta =
        text.startsWith(openDelim, j) && !escaped(j) ? 1 : text.startsWith(closeDelim, j) && !escaped(j) ? -1 : 0;

      if (delta) {
        depth += delta;

        // 找到了匹配的结束位置
        if (!depth)
          return {
            start: i,
            end: j + closeDelim.length,
            pre: text.slice(0, i),
            body: text.slice(i + openDelim.length, j),
            post: text.slice(j + closeDelim.length)
          };

        // 跳过已处理的分隔符字符，避免重复检查
        j += (delta > 0 ? openDelim : closeDelim).length - 1;
      }
    }
  }

  return null;
};

/**
 * 转换 LaTeX 公式括号 `\[\]` 和 `\(\)` 为 Markdown 格式 `$$...$$` 和 `$...$`
 *
 * remark-math 本身不支持 LaTeX 原生语法，作为替代的一些插件效果也不理想。
 *
 * 目前的实现：
 * - 保护代码块和链接，避免被 remark-math 处理
 * - 支持嵌套括号的平衡匹配
 * - 转义括号 `\\(\\)` 或 `\\[\\]` 不会被处理
 *
 * @see https://github.com/remarkjs/remark-math/issues/39
 * @param text 输入的 Markdown 文本
 * @returns 处理后的字符串
 */
export const processLatexBrackets = (text: string) => {
  // 没有 LaTeX 模式直接返回
  if (!containsLatexRegex.test(text)) {
    return text;
  }

  // 保护代码块和链接
  const protectedItems: string[] = [];
  let processedContent = text;

  processedContent = processedContent
    // 保护代码块（包括多行代码块和行内代码）
    .replace(/(```[\s\S]*?```|`[^`]*`)/g, (match) => {
      const index = protectedItems.length;
      protectedItems.push(match);
      return `__AETHER_LINK_PROTECTED_${index}__`;
    })
    // 保护链接 [text](url)
    .replace(/\[([^[\]]*(?:\[[^\]]*\][^[\]]*)*)\]\([^)]*?\)/g, (match) => {
      const index = protectedItems.length;
      protectedItems.push(match);
      return `__AETHER_LINK_PROTECTED_${index}__`;
    });

  // LaTeX 括号转换函数
  const processMath = (content: string, openDelim: string, closeDelim: string, wrapper: string): string => {
    let result = '';
    let remaining = content;

    while (remaining.length > 0) {
      const match = findLatexMatch(remaining, openDelim, closeDelim);
      if (!match) {
        result += remaining;
        break;
      }

      result += match.pre;
      result += `${wrapper}${match.body}${wrapper}`;
      remaining = match.post;
    }

    return result;
  };

  // 先处理块级公式，再处理内联公式
  let result = processMath(processedContent, '\\[', '\\]', '$$');
  result = processMath(result, '\\(', '\\)', '$');

  // 还原被保护的内容
  result = result.replace(/__AETHER_LINK_PROTECTED_(\d+)__/g, (match, indexStr) => {
    const index = parseInt(indexStr, 10);
    // 添加边界检查，防止数组越界
    if (index >= 0 && index < protectedItems.length) {
      return protectedItems[index];
    }
    // 如果索引无效，保持原始匹配
    return match;
  });

  return result;
};

/**
 * @deprecated 请使用 processLatexBrackets 代替
 * 转义括号处理（旧版，不保护代码块）
 */
export function escapeBrackets(text: string): string {
  const pattern = /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\]|\\\((.*?)\\\)/g;
  return text.replace(pattern, (match, codeBlock, squareBracket, roundBracket) => {
    if (codeBlock) {
      return codeBlock;
    } else if (squareBracket) {
      return `\n$$\n${squareBracket}\n$$\n`;
    } else if (roundBracket) {
      return `$${roundBracket}$`;
    }
    return match;
  });
}

/**
 * 移除SVG空行处理
 */
export function removeSvgEmptyLines(text: string): string {
  const svgPattern = /(<svg[\s\S]*?<\/svg>)/g;
  return text.replace(svgPattern, (svgMatch) => {
    return svgMatch
      .split('\n')
      .filter((line) => line.trim() !== '')
      .join('\n');
  });
}

/**
 * @deprecated 请使用 processLatexBrackets 代替
 * 转换数学公式格式（旧版，不保护代码块）
 */
export function convertMathFormula(text: string): string {
  // 将 \[ \] 转换为 $$ $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, '\n$$\n$1\n$$\n');

  // 将 \( \) 转换为 $ $
  text = text.replace(/\\\((.*?)\\\)/g, '$$$1$$');

  return text;
}

/**
 * 移除文件名中的特殊字符
 */
export function removeSpecialCharactersForFileName(fileName: string): string {
  // 移除或替换不安全的文件名字符
  let result = fileName
    .replace(/[<>:"/\\|?*]/g, '') // 移除Windows不允许的字符
    .replace(/^\.+/, '') // 移除开头的点
    .replace(/\.+$/, '') // 移除结尾的点
    .replace(/\s+/g, ' ') // 将多个空格替换为单个空格
    .trim(); // 移除前后空格

  // 移除控制字符（避免ESLint警告）
  result = (result || '').split('').filter(char => {
    const code = char.charCodeAt(0);
    return code >= 32 && code !== 127 && (code < 128 || code > 159);
  }).join('');

  return result.slice(0, 100) || 'Untitled'; // 限制长度并提供默认名称
}

/**
 * HTML 实体编码
 * 用于将字符串安全地嵌入 HTML 属性中
 */
export function encodeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 清理 Markdown 内容
 * 移除多余的换行和空格
 */
export function cleanMarkdownContent(content: string): string {
  return content
    .replace(/\n{3,}/g, '\n\n')  // 多个换行符替换为两个
    .replace(/^\s+|\s+$/g, '');  // 移除首尾空白
}
