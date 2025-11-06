import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setThemeStyle } from '../../shared/store/settingsSlice';
import { themeConfigs, getThemePreviewColors } from '../../shared/config/themes';
import type { ThemeStyle } from '../../shared/config/themes';
import {
  CheckCircle as CheckCircleIcon,
  Palette as PaletteIcon,
  Sparkles as AutoAwesomeIcon,
  Leaf as LeafIcon,
  Zap as ZapIcon,
  Heart as HeartIcon,
  Waves as WavesIcon,
  Sunrise as SunriseIcon,
  Coffee as CoffeeIcon,
  Mountain as MountainIcon,
  Cherry as CherryIcon,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

// 主题图标映射
const themeIcons: Record<ThemeStyle, React.ReactNode> = {
  default: <PaletteIcon />,
  claude: <AutoAwesomeIcon />,
  nature: <LeafIcon />,
  tech: <ZapIcon />,
  soft: <HeartIcon />,
  ocean: <WavesIcon />,
  sunset: <SunriseIcon />,
  cinnamonSlate: <CoffeeIcon />,
  horizonGreen: <MountainIcon />,
  cherryCoded: <CherryIcon />,
};

interface ThemeStyleSelectorProps {
  compact?: boolean;
}

const ThemeStyleSelector: React.FC<ThemeStyleSelectorProps> = ({ compact = false }) => {
  const dispatch = useDispatch();
  const currentTheme = useTheme();
  const currentThemeStyle = useSelector((state: any) => state.settings.themeStyle) || 'default';
  const { t } = useTranslation();

  const handleThemeStyleChange = (themeStyle: ThemeStyle) => {
    dispatch(setThemeStyle(themeStyle));
  };

  const ThemePreviewCard: React.FC<{ themeStyle: ThemeStyle }> = ({ themeStyle }) => {
    const config = themeConfigs[themeStyle];
    const previewColors = getThemePreviewColors(themeStyle);
    const isSelected = currentThemeStyle === themeStyle;
    // 获取翻译的主题名称和描述
    const themeName = t(`settings.appearance.themeStyle.themes.${themeStyle}.name`);
    const themeDescription = t(`settings.appearance.themeStyle.themes.${themeStyle}.description`);

    return (
      <Card
        elevation={0}
        sx={{
          position: 'relative',
          border: '2px solid',
          borderColor: isSelected ? currentTheme.palette.primary.main : 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            borderColor: isSelected ? currentTheme.palette.primary.main : alpha(currentTheme.palette.primary.main, 0.5),
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          },
        }}
      >
        <CardActionArea 
          onClick={() => handleThemeStyleChange(themeStyle)}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          <CardContent sx={{ 
            p: compact ? 1.5 : 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            '&:last-child': {
              pb: compact ? 1.5 : 2,
            }
          }}>
            {/* 选中状态指示器 */}
            {isSelected && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 1,
                }}
              >
                <CheckCircleIcon
                  size={20}
                  style={{
                    color: currentTheme.palette.primary.main,
                  }}
                />
              </Box>
            )}

            {/* 主题预览区域 */}
            <Box
              sx={{
                height: compact ? 50 : 70,
                borderRadius: 1.5,
                mb: 1.2,
                position: 'relative',
                overflow: 'hidden',
                background: config.gradients?.primary || previewColors.primary,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {/* 模拟界面元素 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  right: 8,
                  height: 20,
                  bgcolor: previewColors.paper,
                  borderRadius: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: previewColors.primary,
                    mr: 0.5,
                  }}
                />
                <Box
                  sx={{
                    flex: 1,
                    height: 4,
                    bgcolor: alpha(previewColors.primary, 0.3),
                    borderRadius: 0.5,
                  }}
                />
              </Box>

              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  right: 8,
                  height: 16,
                  bgcolor: alpha(previewColors.paper, 0.9),
                  borderRadius: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 8,
                    bgcolor: previewColors.secondary,
                    borderRadius: 0.5,
                  }}
                />
                <Box
                  sx={{
                    width: 20,
                    height: 8,
                    bgcolor: alpha(previewColors.primary, 0.5),
                    borderRadius: 0.5,
                  }}
                />
              </Box>
            </Box>

            {/* 主题信息 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.8 }}>
              <Box
                sx={{
                  color: previewColors.primary,
                  mr: 1,
                  display: 'flex',
                  alignItems: 'center',
                  '& svg': {
                    width: compact ? 18 : 20,
                    height: compact ? 18 : 20,
                  }
                }}
              >
                {themeIcons[themeStyle]}
              </Box>
              <Typography
                variant={compact ? 'body2' : 'subtitle2'}
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: compact ? '0.875rem' : '0.95rem',
                }}
              >
                {themeName}
              </Typography>
            </Box>

            {!compact && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  mb: 1,
                  lineHeight: 1.35,
                  minHeight: '2.7em',
                  flex: 1,
                  fontSize: '0.8rem',
                }}
              >
                {themeDescription}
              </Typography>
            )}

            {/* 颜色预览 */}
            <Box sx={{ 
              display: 'flex', 
              gap: 0.5, 
              alignItems: 'center',
              mt: 'auto',
              flexWrap: 'wrap'
            }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: previewColors.primary,
                  border: '1.5px solid',
                  borderColor: 'background.paper',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                }}
              />
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: previewColors.secondary,
                  border: '1.5px solid',
                  borderColor: 'background.paper',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                }}
              />
              {config.colors.accent && (
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: config.colors.accent,
                    border: '1.5px solid',
                    borderColor: 'background.paper',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  }}
                />
              )}
              {isSelected && (
                <Chip
                  label={t('settings.appearance.themeStyle.current')}
                  size="small"
                  sx={{
                    ml: 'auto',
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: alpha(currentTheme.palette.primary.main, 0.1),
                    color: currentTheme.palette.primary.main,
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      px: 0.75,
                      py: 0,
                    }
                  }}
                />
              )}
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  };

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          mb: 2,
          color: 'text.primary',
        }}
      >
        {t('settings.appearance.themeStyle.title')}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
      >
        {t('settings.appearance.themeStyle.description')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: compact 
            ? 'repeat(auto-fill, minmax(140px, 1fr))' 
            : {
                xs: 'repeat(auto-fill, minmax(160px, 1fr))',
                sm: 'repeat(auto-fill, minmax(180px, 1fr))',
                md: 'repeat(auto-fill, minmax(200px, 1fr))',
                lg: 'repeat(auto-fill, minmax(220px, 1fr))',
              },
          gap: compact ? 1.5 : 2,
          justifyContent: 'center',
          alignItems: 'stretch',
        }}
      >
        {(Object.keys(themeConfigs) as ThemeStyle[]).map((themeStyle) => (
          <ThemePreviewCard key={themeStyle} themeStyle={themeStyle} />
        ))}
      </Box>

      {/* 主题特性说明 */}
      <Box sx={{ mt: 3, p: 2, bgcolor: alpha(currentTheme.palette.primary.main, 0.05), borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          {t('settings.appearance.themeStyle.tip')}
        </Typography>
      </Box>
    </Box>
  );
};

export default ThemeStyleSelector;
