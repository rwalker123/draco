import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  TextField,
  Chip,
} from '@mui/material';
import { Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { EmailService } from '../../../services/emailService';
import { useAuth } from '../../../context/AuthContext';
import { EmailTemplate } from '../../../types/emails/email';
import { formatDateTime } from '../../../utils/dateUtils';
import { sanitizeRichContent } from '../../../utils/sanitization';
import { extractVariables } from '../../../utils/templateUtils';

interface TemplatePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  template: EmailTemplate;
  accountId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`preview-tabpanel-${index}`}
      aria-labelledby={`preview-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function TemplatePreviewDialog({
  open,
  onClose,
  template,
  accountId,
}: TemplatePreviewDialogProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ subject: string; body: string } | null>(null);

  // Sample variable data
  const [sampleVariables, setSampleVariables] = useState<Record<string, string>>({
    firstName: 'John',
    lastName: 'Smith',
    parentName: 'Jane Smith',
    playerName: 'John Smith',
    teamName: 'Eagles',
    leagueName: 'Youth Baseball League',
    seasonName: '2024 Spring Season',
    gameDate: 'Saturday, March 15, 2024',
    gameTime: '10:00 AM',
    fieldName: 'Central Park Field 1',
    accountName: 'City Sports Association',
    managerName: 'Coach Johnson',
    coachName: 'Coach Wilson',
  });

  // Extract variables from template using shared utility

  const allVariables = [
    ...(template.subjectTemplate ? extractVariables(template.subjectTemplate) : []),
    ...extractVariables(template.bodyTemplate),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleVariableChange =
    (variable: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setSampleVariables((prev) => ({
        ...prev,
        [variable]: event.target.value,
      }));
    };

  const generatePreview = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const service = new EmailService(token);
      const preview = await service.previewTemplate(
        accountId,
        template.id.toString(),
        sampleVariables,
      );
      setPreviewData(preview);
    } catch (err) {
      console.error('Failed to generate preview:', err);
      setError('Failed to generate template preview. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [accountId, template.id, sampleVariables, token]);

  // Generate preview when dialog opens or variables change
  useEffect(() => {
    if (open && template) {
      generatePreview();
    }
  }, [open, template, sampleVariables, generatePreview]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '85vh' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="div">
              Template Preview: {template.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {template.description}
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={generatePreview}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Preview" />
          <Tab label="Sample Data" />
          <Tab label="Template Info" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {previewData ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Subject Preview */}
              {previewData.subject && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Subject:
                  </Typography>
                  <Typography variant="h6" component="div">
                    {previewData.subject}
                  </Typography>
                </Paper>
              )}

              {/* Body Preview */}
              <Paper sx={{ p: 2, flex: 1 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Email Content:
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    minHeight: 200,
                    maxHeight: 400,
                    overflow: 'auto',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeRichContent(previewData.body) }}
                />
              </Paper>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Generating preview...
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Sample Variable Data
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize the sample data below to see how your template will look with different
              values.
            </Typography>

            {allVariables.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {allVariables.map((variable) => (
                  <Box
                    key={variable}
                    sx={{
                      flex: {
                        xs: '1 1 100%',
                        sm: '1 1 calc(50% - 8px)',
                        md: '1 1 calc(33.333% - 11px)',
                      },
                      minWidth: 200,
                    }}
                  >
                    <TextField
                      label={`{${variable}}`}
                      value={sampleVariables[variable] || ''}
                      onChange={handleVariableChange(variable)}
                      fullWidth
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                This template doesn&apos;t contain any variables. The preview will show the template
                exactly as written.
              </Alert>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Template Information
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                <Typography variant="body2" color="text.secondary">
                  Template ID
                </Typography>
                <Typography variant="body1">{template.id.toString()}</Typography>
              </Box>

              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">{formatDateTime(template.createdAt)}</Typography>
              </Box>

              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">{formatDateTime(template.updatedAt)}</Typography>
              </Box>

              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={template.isActive ? 'Active' : 'Inactive'}
                  color={template.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              {allVariables.length > 0 && (
                <Box sx={{ flex: '1 1 100%' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Variables Used
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {allVariables.map((variable) => (
                      <Chip
                        key={variable}
                        label={`{${variable}}`}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
