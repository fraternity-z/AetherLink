import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent
} from '@mui/material';
import { Search, X, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../shared/store';
import { debounce } from 'lodash';
import dayjs from 'dayjs';
import { getMainTextContent } from '../../shared/utils/blockUtils';
import { selectMessagesForTopic } from '../../shared/store/selectors/messageSelectors';

interface SearchResult {
  id: string;
  topicId: string;
  topicName: string;
  messageContent: string;
  messageRole: 'user' | 'assistant';
  createdAt: string;
  highlightedContent?: string;
}

interface ChatSearchInterfaceProps {
  open: boolean;
  onClose: () => void;
  onTopicSelect?: (topicId: string) => void;
  onMessageSelect?: (topicId: string, messageId: string) => void;
}

const ChatSearchInterface: React.FC<ChatSearchInterfaceProps> = ({
  open,
  onClose,
  onTopicSelect,
  onMessageSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStats, setSearchStats] = useState({ count: 0, time: 0 });

  // 从Redux获取所有助手和话题数据
  const assistants = useSelector((state: RootState) => state.assistants.assistants);
  const allTopics = useMemo(() => {
    return assistants.flatMap(assistant => assistant.topics || []);
  }, [assistants]);

  // 获取Redux state用于消息查询
  const reduxState = useSelector((state: RootState) => state);

  // 高亮搜索关键词
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    
    const keywords = query.toLowerCase().split(' ').filter(k => k.length > 0);
    let highlightedText = text;
    
    keywords.forEach(keyword => {
      try {
        const regex = new RegExp(`(${keyword})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
      } catch (error) {
        // 忽略正则表达式错误
      }
    });
    
    return highlightedText;
  }, []);

  // 搜索函数
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchStats({ count: 0, time: 0 });
      return;
    }

    setIsSearching(true);
    const startTime = performance.now();
    const results: SearchResult[] = [];
    const keywords = query.toLowerCase().split(' ').filter(k => k.length > 0);

    try {
      // 搜索话题名称和消息内容
      for (const topic of allTopics) {
        // 搜索话题名称
        const topicNameMatch = keywords.some(keyword => 
          topic.name?.toLowerCase().includes(keyword)
        );

        if (topicNameMatch) {
          results.push({
            id: `topic-${topic.id}`,
            topicId: topic.id,
            topicName: topic.name || '未命名话题',
            messageContent: '话题标题匹配',
            messageRole: 'user',
            createdAt: topic.createdAt || new Date().toISOString(),
            highlightedContent: highlightText(topic.name || '', query)
          });
        }

        // 搜索消息内容 - 使用新的消息系统
        const topicMessages = selectMessagesForTopic(reduxState, topic.id);
        if (topicMessages && topicMessages.length > 0) {
          for (const message of topicMessages) {
            // 使用getMainTextContent函数从消息块中获取文本内容
            let messageText = '';

            try {
              // 首先尝试从消息的content字段获取
              if (message.content && typeof message.content === 'string') {
                messageText = message.content;
              } else {
                // 使用getMainTextContent从消息块中获取内容
                messageText = getMainTextContent(message);
              }
            } catch (error) {
              console.warn('获取消息内容失败:', error);
              continue;
            }

            if (messageText && messageText.trim() && keywords.some(keyword =>
              messageText.toLowerCase().includes(keyword)
            )) {
              // 截取匹配的内容片段
              const snippet = messageText.length > 150
                ? messageText.substring(0, 150) + '...'
                : messageText;

              results.push({
                id: `message-${message.id}`,
                topicId: topic.id,
                topicName: topic.name || '未命名话题',
                messageContent: snippet,
                messageRole: message.role || 'user',
                createdAt: message.createdAt || new Date().toISOString(),
                highlightedContent: highlightText(snippet, query)
              });
            }
          }
        }
      }

      const endTime = performance.now();
      const searchTime = (endTime - startTime) / 1000;

      // 按时间排序，最新的在前
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setSearchResults(results);
      setSearchStats({ count: results.length, time: searchTime });
    } catch (error) {
      console.error('搜索过程中发生错误:', error);
      setSearchResults([]);
      setSearchStats({ count: 0, time: 0 });
    } finally {
      setIsSearching(false);
    }
  }, [allTopics, highlightText]);

  // 防抖搜索
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch]
  );

  // 监听搜索查询变化
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  // 清空搜索
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchStats({ count: 0, time: 0 });
  }, []);

  // 处理搜索结果点击
  const handleResultClick = useCallback((result: SearchResult) => {
    if (result.id.startsWith('topic-')) {
      onTopicSelect?.(result.topicId);
    } else if (result.id.startsWith('message-')) {
      const messageId = result.id.replace('message-', '');
      onMessageSelect?.(result.topicId, messageId);
    }
    onClose();
  }, [onTopicSelect, onMessageSelect, onClose]);

  // 按日期分组搜索结果
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: SearchResult[] } = {};
    
    searchResults.forEach(result => {
      const date = dayjs(result.createdAt).format('MM/DD');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(result);
    });
    
    return groups;
  }, [searchResults]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            maxHeight: '80vh',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: '0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.20)'
          }
        },
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }
        }
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '80vh' }}>
        {/* 搜索头部 */}
        <Box sx={{
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              搜索话题和消息
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            placeholder="搜索话题和消息..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            variant="outlined"
            size="medium"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <X size={18} />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: 'background.default',
                '&:hover': {
                  bgcolor: 'action.hover'
                },
                '&.Mui-focused': {
                  bgcolor: 'background.paper'
                }
              }
            }}
          />

          {/* 搜索统计 */}
          {searchQuery && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {isSearching ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    搜索中...
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  找到 {searchStats.count} 个结果 ({searchStats.time.toFixed(3)}s)
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* 搜索结果 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {searchQuery && searchResults.length === 0 && !isSearching && (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: 'text.secondary'
            }}>
              <Search size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                没有找到匹配的结果
              </Typography>
              <Typography variant="body2">
                尝试使用不同的关键词
              </Typography>
            </Box>
          )}

          {Object.entries(groupedResults).map(([date, results]) => (
            <Box key={date} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{
                mb: 2,
                color: 'text.secondary',
                fontSize: '1.1rem',
                fontWeight: 600
              }}>
                {date}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List disablePadding>
                {results.map((result) => (
                  <ListItem
                    key={result.id}
                    component="div"
                    onClick={() => handleResultClick(result)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="subtitle1"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          >
                            {result.topicName}
                          </Typography>
                          <Chip
                            label={result.messageRole === 'user' ? '用户' : '助手'}
                            size="small"
                            variant="outlined"
                            color={result.messageRole === 'user' ? 'primary' : 'secondary'}
                            sx={{ fontSize: '0.75rem', height: 22 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              mb: 1,
                              '& mark': {
                                backgroundColor: 'warning.light',
                                color: 'warning.contrastText',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontWeight: 500
                              }
                            }}
                            dangerouslySetInnerHTML={{
                              __html: result.highlightedContent || result.messageContent
                            }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Clock size={14} />
                            <Typography variant="caption" color="text.secondary">
                              {dayjs(result.createdAt).format('HH:mm')}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ChatSearchInterface;
