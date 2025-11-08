'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import type { PlayerSurveyCategoryType } from '@draco/shared-schemas';
import { listPlayerSurveyCategories } from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { useApiClient } from '../../../../../hooks/useApiClient';
import WidgetShell from '@/components/ui/WidgetShell';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import { unwrapApiResult } from '@/utils/apiResult';
import SurveyStructureWidget, { sortCategories } from './SurveyStructureWidget';
import SurveyResponsesWidget from './SurveyResponsesWidget';

interface SurveyManagementPageProps {
  accountId: string;
}

const SurveyManagementPage: React.FC<SurveyManagementPageProps> = ({ accountId }) => {
  const apiClient = useApiClient();
  const {
    settings: accountSettings,
    loading: settingsLoading,
    error: settingsLoadError,
    updatingKey: settingUpdatingKey,
    updateSetting,
  } = useAccountSettings(accountId, { requireManage: true });
  const [categories, setCategories] = useState<PlayerSurveyCategoryType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const hasFetchedCategoriesRef = React.useRef(false);
  const [responsesInitialized, setResponsesInitialized] = useState(false);

  const handleSuccess = useCallback((message: string) => {
    setGlobalSuccess(message);
    setGlobalError(null);
  }, []);

  const handleError = useCallback((message: string) => {
    setGlobalError(message);
    setGlobalSuccess(null);
  }, []);

  const surveySetting = useMemo(
    () => accountSettings?.find((setting) => setting.definition.key === 'ShowPlayerSurvey'),
    [accountSettings],
  );

  const handleSurveyAvailabilityToggle = useCallback(
    async (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      try {
        await updateSetting('ShowPlayerSurvey', checked);
        setGlobalError(null);
        setGlobalSuccess(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to update player survey availability.';
        handleError(message);
      }
    },
    [handleError, updateSetting],
  );

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);

    try {
      const response = await listPlayerSurveyCategories({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const data = unwrapApiResult(response, 'Failed to load survey categories');
      const normalized = data?.map((category) => ({
        ...category,
        questions: category.questions ?? [],
      }));
      setCategories(normalized ? sortCategories(normalized) : []);
    } catch (error) {
      console.error('Failed to load survey categories', error);
      setCategoriesError('Failed to load survey categories.');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [accountId, apiClient]);

  useEffect(() => {
    if (hasFetchedCategoriesRef.current) {
      return;
    }
    hasFetchedCategoriesRef.current = true;
    void refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    hasFetchedCategoriesRef.current = false;
  }, [accountId]);

  useEffect(() => {
    if (activeTab === 1 && !responsesInitialized) {
      setResponsesInitialized(true);
    }
  }, [activeTab, responsesInitialized]);

  const handleCategoriesChange = useCallback(
    (updater: (prev: PlayerSurveyCategoryType[]) => PlayerSurveyCategoryType[]) => {
      setCategories((prev) => sortCategories(updater(prev)));
    },
    [],
  );

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="text.primary" sx={{ fontWeight: 'bold' }}>
            Player Survey Management
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 620, mx: 'auto' }}
          >
            Create categories and questions for your player surveys, and review or edit player
            responses from one workspace.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          {globalError && <Alert severity="error">{globalError}</Alert>}
          {globalSuccess && <Alert severity="success">{globalSuccess}</Alert>}

          <WidgetShell
            title="Survey Availability"
            subtitle="Enable or disable player surveys for account members."
            accent="primary"
          >
            {settingsLoadError ? (
              <Alert severity="error">{settingsLoadError}</Alert>
            ) : (
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(surveySetting?.value)}
                      onChange={handleSurveyAvailabilityToggle}
                      disabled={
                        settingsLoading ||
                        !surveySetting ||
                        settingUpdatingKey === 'ShowPlayerSurvey'
                      }
                      color="primary"
                    />
                  }
                  label={
                    surveySetting?.value
                      ? 'Player surveys are enabled for this account'
                      : 'Player surveys are disabled for this account'
                  }
                />
                <Typography variant="body2" color="text.secondary">
                  When disabled, public links and widgets for player surveys are hidden, but your
                  categories and responses remain intact.
                </Typography>
              </Stack>
            )}
          </WidgetShell>

          <Tabs
            value={activeTab}
            onChange={(_event, newValue) => setActiveTab(newValue)}
            aria-label="Survey management tabs"
          >
            <Tab
              label="Survey Structure"
              id="survey-structure-tab"
              aria-controls="survey-structure-panel"
            />
            <Tab
              label="Player Responses"
              id="survey-responses-tab"
              aria-controls="survey-responses-panel"
            />
          </Tabs>

          <Box
            role="tabpanel"
            id="survey-structure-panel"
            aria-labelledby="survey-structure-tab"
            hidden={activeTab !== 0}
            sx={{ display: activeTab === 0 ? 'block' : 'none' }}
          >
            {activeTab === 0 && (
              <SurveyStructureWidget
                accountId={accountId}
                apiClient={apiClient}
                categories={categories}
                loading={categoriesLoading}
                error={categoriesError}
                onCategoriesChange={handleCategoriesChange}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
          </Box>

          <Box
            role="tabpanel"
            id="survey-responses-panel"
            aria-labelledby="survey-responses-tab"
            hidden={activeTab !== 1}
            sx={{ display: activeTab === 1 ? 'block' : 'none' }}
          >
            {activeTab === 1 &&
              (responsesInitialized ? (
                <SurveyResponsesWidget
                  accountId={accountId}
                  apiClient={apiClient}
                  categories={categories}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              ) : (
                <WidgetShell
                  title="Player Responses"
                  subtitle="Review answers and manage outreach."
                  accent="info"
                  sx={{ minHeight: 200 }}
                >
                  <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress size={24} />
                  </Box>
                </WidgetShell>
              ))}
          </Box>
        </Stack>
      </Box>
    </main>
  );
};

export default SurveyManagementPage;
