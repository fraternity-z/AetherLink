import React, { memo } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { ChevronDown } from 'lucide-react';
import type { Model } from '../../shared/types';

export interface ModelGroupProps {
  /** Model groups data in format [[groupName, models[]], ...] */
  modelGroups: [string, Model[]][];
  /** Whether to show empty state */
  showEmptyState?: boolean;
  /** Translation key for empty state text */
  emptyStateKey?: string;
  /** Custom function to render each model item */
  renderModelItem?: (model: Model, index: number) => React.ReactNode;
  /** Function to render group header button */
  renderGroupButton?: (groupName: string, models: Model[]) => React.ReactNode;
  /** Default expanded groups */
  defaultExpanded?: string[];
  /** Callback when group expansion changes */
  onExpansionChange?: (groupName: string, expanded: boolean) => void;
}

const DefaultModelItem = memo<{ model: Model; index: number }>(({ model }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        py: 1,
        px: 1.5,
        borderRadius: 1,
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {model.name || model.id}
        </Typography>
      </Box>
    </Box>
  );
});

DefaultModelItem.displayName = 'DefaultModelItem';

export default function ModelGroup({
  modelGroups,
  showEmptyState = true,
  emptyStateKey = 'models.no_models',
  renderModelItem = (model, index) => <DefaultModelItem model={model} index={index} />,
  renderGroupButton,
  defaultExpanded = [],
  onExpansionChange
}: ModelGroupProps) {
  const theme = useTheme();
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(defaultExpanded)
  );

  const handleExpansionChange = React.useCallback((groupName: string) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      const isExpanded = prev.has(groupName);
      
      if (isExpanded) {
        newExpanded.delete(groupName);
      } else {
        newExpanded.add(groupName);
      }
      
      onExpansionChange?.(groupName, !isExpanded);
      return newExpanded;
    });
  }, [onExpansionChange]);

  if (showEmptyState && modelGroups.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
          minHeight: 80,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyStateKey}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', px: 0 }}>
      {modelGroups.map(([groupName, models]) => {
        const isExpanded = expandedGroups.has(groupName);
        
        return (
          <Accordion
            key={groupName}
            expanded={isExpanded}
            onChange={() => handleExpansionChange(groupName)}
            disableGutters
            TransitionProps={{ 
              timeout: 200,
              unmountOnExit: true 
            }}
            sx={{
              mb: { xs: 2.5, sm: 2 },
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              '&:before': {
                display: 'none',
              },
              '&.Mui-expanded': {
                margin: { xs: '0 0 20px 0', sm: '0 0 16px 0' },
              },
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <AccordionSummary
                expandIcon={<ChevronDown size={20} />}
                sx={{
                  minHeight: { xs: 56, sm: 48 },
                  px: { xs: 2.5, sm: 2 },
                  py: { xs: 1.5, sm: 1 },
                  pr: renderGroupButton ? { xs: 6, sm: 5 } : { xs: 2.5, sm: 2 },
                  '& .MuiAccordionSummary-content': {
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                  },
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    transition: 'transform 0.2s ease',
                  },
                  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                    transform: 'rotate(180deg)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 1.5 }, flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '0.875rem' } }}>
                    {groupName}
                  </Typography>
                  <Chip
                    label={models.length}
                    size="small"
                    sx={{
                      height: { xs: 24, sm: 20 },
                      fontSize: { xs: '0.75rem', sm: '0.7rem' },
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      color: 'success.main',
                      '& .MuiChip-label': {
                        px: { xs: 1.5, sm: 1 },
                      },
                    }}
                  />
                </Box>
              </AccordionSummary>
              {renderGroupButton && (
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    position: 'absolute',
                    right: { xs: 2.5, sm: 2 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                  }}
                >
                  {renderGroupButton(groupName, models)}
                </Box>
              )}
            </Box>
            <AccordionDetails
              sx={{
                px: 0,
                pt: { xs: 1, sm: 0.75 },
                pb: { xs: 1.5, sm: 1.25 },
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1.25, sm: 0.75 },
                willChange: 'height, opacity',
                transform: 'translateZ(0)',
              }}
            >
              {models.map((model, modelIndex) => (
                <React.Fragment key={model.id || modelIndex}>
                  {renderModelItem(model, modelIndex)}
                </React.Fragment>
              ))}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

