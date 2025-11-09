import React from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  alpha,
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeStyleSelector from '../../components/settings/ThemeStyleSelector';
import useScrollPosition from '../../hooks/useScrollPosition';
import { useTranslation } from '../../i18n';

const ThemeStyleSettings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-theme-style', {
    autoRestore: true,
    restoreDelay: 100
  });

  const handleBack = () => {
    navigate('/settings/appearance');
  };

  return (
    <Box sx={{
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: (theme) => theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.main, 0.02)
        : alpha(theme.palette.background.default, 0.9),
    }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label="back"
            sx={{
              color: (theme) => theme.palette.primary.main,
            }}
          >
            <ArrowLeft size={24} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
              }}
            >
            {t('settings.appearance.themeStyle.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: { xs: 2, sm: 3 },
          mt: 8,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        {/* Theme Style Selector */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <ThemeStyleSelector compact={false} />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ThemeStyleSettings;

