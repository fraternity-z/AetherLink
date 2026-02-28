import React from 'react';
import {
  Box,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Button,
  Divider,
  alpha
} from '@mui/material';
import CustomSwitch from '../../../components/CustomSwitch';
import {
  Cpu as StorageIcon,
  Bot as BotIcon,
  Trash2 as DeleteIcon
} from 'lucide-react';
import type { MCPServer } from '../../../shared/types';
import { useTranslation } from '../../../i18n';
import { getServerTypeLabel, getBuiltinServerDescription, getTagTranslation } from './mcpServerUtils';

interface BuiltinServerListItemProps {
  template: MCPServer;
  index: number;
  total: number;
  addedServer: MCPServer | undefined;
  deletingId: string | null;
  onToggleServer: (serverId: string, isActive: boolean) => void;
  onDeleteServer: (server: MCPServer) => void;
  onAddBuiltinServer: (server: MCPServer) => void;
  onNavigateAssistant: (server: MCPServer) => void;
  onEditServer: (server: MCPServer) => void;
}

const BuiltinServerListItem: React.FC<BuiltinServerListItemProps> = ({
  template,
  index,
  total,
  addedServer,
  deletingId,
  onToggleServer,
  onDeleteServer,
  onAddBuiltinServer,
  onNavigateAssistant,
  onEditServer
}) => {
  const { t } = useTranslation();
  const isAdded = !!addedServer;
  const categoryColor = template.category === 'assistant' ? '#8b5cf6' : '#4CAF50';

  return (
    <React.Fragment>
      <ListItem disablePadding sx={{ transition: 'all 0.2s', '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) } }}>
        <ListItemButton onClick={() => {
          if (isAdded) {
            if (template.category === 'assistant') {
              onNavigateAssistant(addedServer!);
            } else {
              onEditServer(addedServer!);
            }
          }
        }} sx={{ flex: 1, cursor: isAdded ? 'pointer' : 'default' }}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: alpha(categoryColor, 0.12), color: categoryColor, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
              {template.category === 'assistant' ? <BotIcon size={20} /> : <StorageIcon size={20} />}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {template.name}
                </Typography>
                <Chip
                  label={getServerTypeLabel('inMemory', t)}
                  size="small"
                  sx={{ bgcolor: alpha(categoryColor, 0.1), color: categoryColor, fontWeight: 500, fontSize: '0.7rem', height: { xs: 20, sm: 24 } }}
                />
                {isAdded && addedServer!.isActive && (
                  <Chip label={t('settings.mcpServer.status.active')} size="small" color="success" variant="outlined"
                    sx={{ fontSize: '0.7rem', height: { xs: 20, sm: 24 } }}
                  />
                )}
              </Box>
            }
            secondary={
              <Box component="div" sx={{ mt: { xs: 0.5, sm: 1 } }}>
                <Typography variant="body2" color="text.secondary" component="div"
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {getBuiltinServerDescription(template.name, t) || template.description}
                </Typography>
                {template.tags && template.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.75 }}>
                    {template.tags.map((tag) => (
                      <Chip key={tag} label={getTagTranslation(tag, t, template.name)} size="small" variant="outlined"
                        sx={(theme) => ({ fontSize: '0.65rem', height: 20, borderColor: 'divider', color: 'text.secondary',
                          backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : '#f9fafb' })}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            }
            secondaryTypographyProps={{ component: 'div' }}
          />
        </ListItemButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 2 }}>
          {isAdded ? (
            <>
              <CustomSwitch checked={addedServer!.isActive}
                onChange={(e) => { e.stopPropagation(); onToggleServer(addedServer!.id, e.target.checked); }}
              />
              <IconButton size="small" disabled={deletingId === addedServer!.id}
                onClick={(e) => { e.stopPropagation(); onDeleteServer(addedServer!); }}
                sx={{ color: deletingId === addedServer!.id ? 'text.disabled' : 'error.main', '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) } }}
              >
                <DeleteIcon size={18} />
              </IconButton>
            </>
          ) : (
            <Button onClick={(e) => { e.stopPropagation(); onAddBuiltinServer(template); }}
              variant="contained" size="small"
              sx={{ backgroundColor: '#10b981', color: 'white', textTransform: 'none', px: 2,
                minHeight: { xs: 36, sm: 32 }, '&:hover': { backgroundColor: '#059669' } }}
            >
              {t('settings.mcpServer.builtinDialog.add')}
            </Button>
          )}
        </Box>
      </ListItem>
      {index < total - 1 && <Divider variant="inset" component="li" sx={{ ml: 0 }} />}
    </React.Fragment>
  );
};

export default BuiltinServerListItem;
