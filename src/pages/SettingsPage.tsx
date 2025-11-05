import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';

const SettingsPageRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // 重定向到新的设置页面
    navigate('/settings', { replace: true });
  }, [navigate]);

  // 显示加载中
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      {t('common.loading')}
    </div>
  );
};

export default SettingsPageRedirect;
