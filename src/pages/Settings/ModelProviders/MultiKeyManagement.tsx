import React from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Button,
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../shared/store';
import { updateProvider } from '../../../shared/store/settingsSlice';
import MultiKeyManager from '../../../components/settings/MultiKeyManager';
import type { ApiKeyConfig, LoadBalanceStrategy } from '../../../shared/config/defaultModels';
import { SafeAreaContainer } from "../../../components/settings/SettingComponents";

const MultiKeyManagementPage: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const provider = useAppSelector(state =>
    state.settings.providers.find(p => p.id === providerId)
  );

  // 如果没有找到对应的提供商，显示错误信息
  if (!provider) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>供应商未找到</Typography>
        <Button onClick={() => navigate('/settings/default-model')}>返回</Button>
      </Box>
    );
  }

  const handleBack = () => {
    navigate(`/settings/model-provider/${providerId}`);
  };

  const handleApiKeysChange = (keys: ApiKeyConfig[]) => {
    dispatch(updateProvider({
      id: provider.id,
      updates: {
        apiKeys: keys,
        // 如果有 keys，清空单个 apiKey
        apiKey: keys.length > 0 ? undefined : provider.apiKey,
      }
    }));
  };

  const handleStrategyChange = (strategy: LoadBalanceStrategy) => {
    dispatch(updateProvider({
      id: provider.id,
      updates: {
        keyManagement: {
          strategy,
          maxFailuresBeforeDisable: provider.keyManagement?.maxFailuresBeforeDisable || 3,
          failureRecoveryTime: provider.keyManagement?.failureRecoveryTime || 5,
          enableAutoRecovery: provider.keyManagement?.enableAutoRecovery ?? true,
        }
      }
    }));
  };

  return (
    <SafeAreaContainer>
      <AppBar
        position="static"
        elevation={0}
        sx={{
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
            onClick={handleBack}
            aria-label="back"
            sx={{
              color: (theme) => theme.palette.primary.main,
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
            }}
          >
            {provider.name} - 多 Key 管理
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          pb: 'var(--content-bottom-padding)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <MultiKeyManager
            providerName={provider.name}
            providerType={provider.providerType || 'openai'}
            apiKeys={provider.apiKeys || []}
            strategy={provider.keyManagement?.strategy || 'round_robin'}
            onKeysChange={handleApiKeysChange}
            onStrategyChange={handleStrategyChange}
          />
        </Paper>
      </Box>
    </SafeAreaContainer>
  );
};

export default MultiKeyManagementPage;


