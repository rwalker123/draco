import React, { useState } from 'react';
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
  TextField,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { EmailTemplate } from '../../../types/emails/email';
import { sanitizeRichContent } from '../../../utils/sanitization';
import { extractVariables } from '../../../utils/templateUtils';

interface TemplatePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  template: EmailTemplate;
  accountId: string;
}

interface PreviewComponentProps {
  template: EmailTemplate;
  sampleVariables: Record<string, string>;
}

// Client-side template replacement utility
const replaceVariables = (template: string, variables: Record<string, string>): string => {
  return template.replace(/{{(\w+)}}/g, (match, key) => variables[key] || match);
};

function SubjectPreview({ template, sampleVariables }: PreviewComponentProps) {
  if (!template.subjectTemplate) return null;

  const renderedSubject = replaceVariables(template.subjectTemplate, sampleVariables);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        Subject:
      </Typography>
      <Typography variant="h6" component="div">
        {renderedSubject}
      </Typography>
    </Paper>
  );
}

function BodyPreview({ template, sampleVariables }: PreviewComponentProps) {
  const renderedBody = replaceVariables(template.bodyTemplate, sampleVariables);

  return (
    <Paper sx={{ p: 2 }}>
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
        dangerouslySetInnerHTML={{ __html: sanitizeRichContent(renderedBody) }}
      />
    </Paper>
  );
}

export default function TemplatePreviewDialog({
  open,
  onClose,
  template,
}: TemplatePreviewDialogProps) {
  const [error, setError] = useState<string | null>(null);

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

  const handleVariableChange =
    (variable: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setSampleVariables((prev) => ({
        ...prev,
        [variable]: event.target.value,
      }));
    };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: { sx: { height: '85vh' } },
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
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Sample Data Section */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Sample Variable Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
        </Paper>

        {/* Preview Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Email Preview
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <SubjectPreview template={template} sampleVariables={sampleVariables} />
            <BodyPreview template={template} sampleVariables={sampleVariables} />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
