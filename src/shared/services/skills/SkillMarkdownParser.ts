/**
 * SKILL.md 解析器
 * 兼容 OpenClaw SKILL.md 格式：YAML frontmatter + Markdown body
 *
 * 格式示例：
 * ---
 * name: my-skill
 * description: "技能描述"
 * metadata:
 *   emoji: "🔧"
 *   tags: ["编程", "工具"]
 *   triggerPhrases: ["触发词1", "触发词2"]
 *   mcpServerId: "optional-mcp-id"
 *   author: "作者"
 *   version: "1.0.0"
 * ---
 *
 * # 技能标题
 *
 * Markdown 正文内容...
 */

import { v4 as uuid } from 'uuid';
import type { Skill } from '../../types/Skill';

// ======================== 类型定义 ========================

interface SkillFrontmatter {
  name?: string;
  description?: string;
  metadata?: {
    emoji?: string;
    tags?: string[];
    triggerPhrases?: string[];
    mcpServerId?: string;
    author?: string;
    version?: string;
    // 兼容 OpenClaw 格式
    openclaw?: {
      emoji?: string;
      requires?: Record<string, unknown>;
    };
  };
  // 顶层兼容字段（简化格式）
  emoji?: string;
  tags?: string[];
  author?: string;
  version?: string;
}

interface ParseResult {
  frontmatter: SkillFrontmatter;
  content: string;
}

// ======================== 解析器 ========================

/**
 * 从 SKILL.md 文本中提取 YAML frontmatter 和 Markdown 正文
 */
function parseFrontmatterBlock(raw: string): ParseResult {
  const trimmed = raw.trim();

  // 检测 --- 开头的 frontmatter
  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, content: trimmed };
  }

  const endIndex = trimmed.indexOf('---', 3);
  if (endIndex === -1) {
    return { frontmatter: {}, content: trimmed };
  }

  const yamlBlock = trimmed.slice(3, endIndex).trim();
  const content = trimmed.slice(endIndex + 3).trim();

  const frontmatter = parseSimpleYaml(yamlBlock);
  return { frontmatter, content };
}

/**
 * 轻量 YAML 解析（不引入完整 YAML 库）
 * 支持：字符串、数组、嵌套对象、带引号的值
 */
function parseSimpleYaml(yaml: string): SkillFrontmatter {
  const result: Record<string, any> = {};
  const lines = yaml.split('\n');
  const stack: { indent: number; obj: Record<string, any> }[] = [{ indent: -1, obj: result }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    const trimmedLine = line.trim();

    // 数组项: "- value"
    if (trimmedLine.startsWith('- ')) {
      const value = parseYamlValue(trimmedLine.slice(2).trim());
      const parent = getParentAtIndent(stack, indent);
      const lastKey = getLastKey(parent);
      if (lastKey && !Array.isArray(parent[lastKey])) {
        parent[lastKey] = [];
      }
      if (lastKey && Array.isArray(parent[lastKey])) {
        parent[lastKey].push(value);
      }
      continue;
    }

    // key: value
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmedLine.slice(0, colonIndex).trim();
    const rawValue = trimmedLine.slice(colonIndex + 1).trim();

    // 回退到正确的层级
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].obj;

    if (rawValue === '' || rawValue === '{}') {
      // 嵌套对象
      const child: Record<string, any> = {};
      parent[key] = rawValue === '{}' ? {} : child;
      if (rawValue !== '{}') {
        stack.push({ indent, obj: child });
      }
    } else if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      // 内联数组: [a, b, c]
      parent[key] = parseInlineArray(rawValue);
    } else if (rawValue.startsWith('{') && rawValue.endsWith('}')) {
      // 内联对象
      parent[key] = parseInlineObject(rawValue);
    } else {
      parent[key] = parseYamlValue(rawValue);
    }
  }

  return result as SkillFrontmatter;
}

function getParentAtIndent(
  stack: { indent: number; obj: Record<string, any> }[],
  indent: number,
): Record<string, any> {
  while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
    stack.pop();
  }
  return stack[stack.length - 1].obj;
}

function getLastKey(obj: Record<string, any>): string | null {
  const keys = Object.keys(obj);
  return keys.length > 0 ? keys[keys.length - 1] : null;
}

function parseYamlValue(raw: string): string | number | boolean {
  // 带引号
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  // 布尔
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  // 数字
  const num = Number(raw);
  if (!isNaN(num) && raw !== '') return num;
  // 字符串
  return raw;
}

function parseInlineArray(raw: string): string[] {
  const inner = raw.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(',').map(s => {
    const trimmed = s.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  });
}

function parseInlineObject(raw: string): Record<string, any> {
  // 简化处理 JSON 格式的内联对象
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ======================== 转换器 ========================

/**
 * 将解析后的 SKILL.md 转换为 AetherLink Skill 对象
 */
function toSkill(parsed: ParseResult): Skill {
  const { frontmatter: fm, content } = parsed;
  const meta = fm.metadata || {};
  const now = new Date().toISOString();

  // 兼容 OpenClaw 的 metadata.openclaw.emoji
  const emoji = fm.emoji
    || meta.emoji
    || meta.openclaw?.emoji
    || '🔧';

  const tags = fm.tags || meta.tags || [];
  const triggerPhrases = meta.triggerPhrases || [];

  return {
    id: uuid(),
    name: fm.name || extractTitleFromContent(content) || '导入的技能',
    description: fm.description || '',
    emoji: typeof emoji === 'string' ? emoji : '🔧',
    tags: Array.isArray(tags) ? tags.map(String) : [],
    content,
    triggerPhrases: Array.isArray(triggerPhrases) ? triggerPhrases.map(String) : [],
    mcpServerId: meta.mcpServerId || undefined,
    source: 'user',
    version: fm.version || meta.version || '1.0.0',
    author: fm.author || meta.author || undefined,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 从 Markdown 内容中提取 # 标题作为名称
 */
function extractTitleFromContent(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// ======================== 导出 API ========================

/**
 * 解析 SKILL.md 文本并转换为 Skill 对象
 */
export function parseSkillMarkdown(markdown: string): Skill {
  const parsed = parseFrontmatterBlock(markdown);
  return toSkill(parsed);
}

/**
 * 批量解析多个 SKILL.md 文件
 */
export function parseMultipleSkillMarkdowns(
  files: { name: string; content: string }[],
): { skills: Skill[]; errors: { name: string; error: string }[] } {
  const skills: Skill[] = [];
  const errors: { name: string; error: string }[] = [];

  for (const file of files) {
    try {
      const skill = parseSkillMarkdown(file.content);
      // 如果 frontmatter 没有 name，用文件名
      if (!skill.name || skill.name === '导入的技能') {
        skill.name = file.name.replace(/\.md$/i, '').replace(/^SKILL$/i, file.name);
      }
      skills.push(skill);
    } catch (error) {
      errors.push({
        name: file.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { skills, errors };
}

/**
 * 将 Skill 对象导出为 SKILL.md 格式
 */
export function skillToMarkdown(skill: Skill): string {
  const lines: string[] = ['---'];
  lines.push(`name: ${skill.name}`);
  if (skill.description) {
    lines.push(`description: "${skill.description}"`);
  }

  // metadata 块
  const hasMeta = skill.emoji || skill.tags?.length || skill.triggerPhrases?.length
    || skill.mcpServerId || skill.author || skill.version;
  if (hasMeta) {
    lines.push('metadata:');
    if (skill.emoji) lines.push(`  emoji: "${skill.emoji}"`);
    if (skill.tags?.length) {
      lines.push(`  tags: [${skill.tags.map(t => `"${t}"`).join(', ')}]`);
    }
    if (skill.triggerPhrases?.length) {
      lines.push(`  triggerPhrases: [${skill.triggerPhrases.map(t => `"${t}"`).join(', ')}]`);
    }
    if (skill.mcpServerId) lines.push(`  mcpServerId: "${skill.mcpServerId}"`);
    if (skill.author) lines.push(`  author: "${skill.author}"`);
    if (skill.version) lines.push(`  version: "${skill.version}"`);
  }

  lines.push('---');
  lines.push('');
  lines.push(skill.content || '');

  return lines.join('\n');
}
