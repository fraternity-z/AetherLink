/**
 * 同义词库配置
 * 用于RAG查询扩展，支持中英文
 */

export interface SynonymEntry {
  word: string;
  synonyms: string[];
  category?: string;
}

/**
 * 中文同义词库
 */
export const CHINESE_SYNONYMS: Record<string, string[]> = {
  // 疑问词
  '问题': ['疑问', '困惑', '难题', '麻烦', '困难', '障碍'],
  '如何': ['怎样', '怎么', '如何才能', '怎么样', '用什么方法'],
  '什么': ['啥', '何为', '哪个', '哪些'],
  '为什么': ['为何', '何故', '原因是什么', '怎么回事'],
  '哪里': ['何处', '在哪', '什么地方'],
  
  // 动作词
  '方法': ['方式', '途径', '手段', '办法', '措施', '策略'],
  '解决': ['处理', '解答', '应对', '修复', '搞定', '完成'],
  '创建': ['新建', '建立', '生成', '制作', '添加'],
  '删除': ['移除', '清除', '去掉', '消除'],
  '修改': ['更改', '编辑', '调整', '变更', '更新'],
  '查找': ['搜索', '寻找', '查询', '检索', '找到'],
  '使用': ['应用', '利用', '运用', '采用', '用'],
  '配置': ['设置', '设定', '调整', '安排'],
  '安装': ['部署', '装载', '设立'],
  '启动': ['开始', '运行', '执行', '开启', '打开'],
  '停止': ['结束', '终止', '关闭', '暂停'],
  
  // 技术词汇
  '错误': ['异常', '故障', '问题', 'bug', '缺陷', '报错'],
  '功能': ['特性', '能力', '作用', '用途'],
  '性能': ['效率', '速度', '表现'],
  '数据': ['信息', '内容', '资料'],
  '文件': ['文档', '资料', '档案'],
  '界面': ['UI', '页面', '窗口', '视图'],
  '代码': ['程序', '脚本', '源码'],
  '服务': ['服务器', '后端', 'API'],
  '网络': ['网路', '连接', '通信'],
  '系统': ['平台', '环境', '框架'],
  
  // 程度词
  '快速': ['迅速', '快捷', '高效', '立即'],
  '简单': ['容易', '便捷', '方便', '基础'],
  '复杂': ['困难', '高级', '繁琐'],
  '重要': ['关键', '核心', '主要', '必要'],
  '全部': ['所有', '全体', '整个', '完整'],
  
  // 状态词
  '成功': ['完成', '实现', '达成'],
  '失败': ['出错', '异常', '未能'],
  '正常': ['正确', '没问题', '良好'],
  '异常': ['不正常', '有问题', '错误'],
};

/**
 * 英文同义词库
 */
export const ENGLISH_SYNONYMS: Record<string, string[]> = {
  // Question words
  'how': ['what way', 'in what manner', 'by what means'],
  'what': ['which', 'that'],
  'why': ['for what reason', 'how come'],
  'where': ['in which place', 'at what location'],
  
  // Action words
  'create': ['make', 'build', 'generate', 'add', 'new'],
  'delete': ['remove', 'clear', 'erase', 'destroy'],
  'update': ['modify', 'change', 'edit', 'alter', 'revise'],
  'find': ['search', 'look for', 'locate', 'discover'],
  'use': ['utilize', 'apply', 'employ'],
  'configure': ['setup', 'set up', 'arrange', 'adjust'],
  'install': ['deploy', 'setup', 'load'],
  'start': ['begin', 'run', 'execute', 'launch', 'initiate'],
  'stop': ['end', 'terminate', 'halt', 'close', 'shutdown'],
  'fix': ['repair', 'resolve', 'solve', 'correct'],
  
  // Technical terms
  'error': ['bug', 'issue', 'problem', 'fault', 'exception'],
  'feature': ['function', 'capability', 'ability'],
  'performance': ['speed', 'efficiency'],
  'data': ['information', 'content'],
  'file': ['document', 'resource'],
  'interface': ['UI', 'page', 'view', 'screen'],
  'code': ['program', 'script', 'source'],
  'service': ['server', 'backend', 'API'],
  'network': ['connection', 'communication'],
  'system': ['platform', 'environment', 'framework'],
  
  // Degree words
  'fast': ['quick', 'rapid', 'speedy', 'efficient'],
  'simple': ['easy', 'basic', 'straightforward'],
  'complex': ['complicated', 'difficult', 'advanced'],
  'important': ['key', 'critical', 'essential', 'vital'],
  'all': ['every', 'entire', 'whole', 'complete'],
};

/**
 * 获取词语的同义词
 * @param word 输入词语
 * @returns 同义词数组
 */
export function getSynonyms(word: string): string[] {
  if (!word) return [];
  
  const lowerWord = word.toLowerCase();
  
  // 先查找中文同义词
  if (CHINESE_SYNONYMS[word]) {
    return CHINESE_SYNONYMS[word];
  }
  
  // 再查找英文同义词
  if (ENGLISH_SYNONYMS[lowerWord]) {
    return ENGLISH_SYNONYMS[lowerWord];
  }
  
  return [];
}

/**
 * 为查询扩展生成同义词
 * @param query 查询字符串
 * @param maxSynonymsPerWord 每个词的最大同义词数
 * @returns 同义词数组
 */
export function generateQuerySynonyms(query: string, maxSynonymsPerWord: number = 2): string[] {
  if (!query) return [];
  
  const synonyms: Set<string> = new Set();
  
  // 分词（简单按空格和标点分割）
  const words = query.split(/[\s,，。.!！?？、；;：:]+/).filter(w => w.length > 0);
  
  for (const word of words) {
    const wordSynonyms = getSynonyms(word);
    // 只取前N个同义词
    wordSynonyms.slice(0, maxSynonymsPerWord).forEach(syn => synonyms.add(syn));
  }
  
  return Array.from(synonyms);
}

/**
 * 检测文本语言（简单检测）
 * @param text 输入文本
 * @returns 'zh' | 'en' | 'mixed'
 */
export function detectLanguage(text: string): 'zh' | 'en' | 'mixed' {
  if (!text) return 'en';
  
  let chineseCount = 0;
  let englishCount = 0;
  
  for (const char of text) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      chineseCount++;
    } else if (/[a-zA-Z]/.test(char)) {
      englishCount++;
    }
  }
  
  if (chineseCount > 0 && englishCount === 0) return 'zh';
  if (englishCount > 0 && chineseCount === 0) return 'en';
  return 'mixed';
}
