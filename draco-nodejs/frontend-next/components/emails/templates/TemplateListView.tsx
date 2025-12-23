import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Preview as PreviewIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import { EmailTemplate } from '../../../types/emails/email';
import { formatDateTime } from '../../../utils/dateUtils';
import { extractVariables } from '../../../utils/templateUtils';
import { EditIconButton, DeleteIconButton } from '../../common/ActionIconButtons';

interface TemplateListViewProps {
  templates: EmailTemplate[];
  onEdit: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
  onDelete: (template: EmailTemplate) => void;
}

export default function TemplateListView({
  templates,
  onEdit,
  onPreview,
  onDelete,
}: TemplateListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter templates based on search term
  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description &&
        template.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Extract variables from template content using shared utility

  return (
    <Box>
      {/* Search and Controls */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Templates Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(auto-fill, minmax(300px, 480px))',
            md: 'repeat(auto-fill, minmax(350px, 480px))',
          },
          gap: 3,
          justifyContent: 'start',
        }}
      >
        {filteredTemplates.map((template) => {
          const subjectVariables = template.subjectTemplate
            ? extractVariables(template.subjectTemplate)
            : [];
          const bodyVariables = extractVariables(template.bodyTemplate);
          const allVariables = [...new Set([...subjectVariables, ...bodyVariables])];

          return (
            <Card
              key={template.id.toString()}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom noWrap>
                      {template.name}
                    </Typography>
                    {template.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {template.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                    <EditIconButton tooltipTitle="Edit Template" onClick={() => onEdit(template)} />
                    <DeleteIconButton
                      tooltipTitle="Delete Template"
                      onClick={() => onDelete(template)}
                    />
                  </Box>
                </Box>

                {/* Subject Preview */}
                {template.subjectTemplate && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Subject:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontStyle: 'italic',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {template.subjectTemplate}
                    </Typography>
                  </Box>
                )}

                {/* Preview Button */}
                <Box sx={{ mb: 2, flex: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={() => onPreview(template)}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Preview Template
                  </Button>
                </Box>

                {/* Variables */}
                {allVariables.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Variables:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {allVariables.slice(0, 3).map((variable) => (
                        <Chip
                          key={variable}
                          label={`{${variable}}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                      {allVariables.length > 3 && (
                        <Chip
                          label={`+${allVariables.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Footer */}
                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Updated {formatDateTime(template.updatedAt)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Empty State */}
      {filteredTemplates.length === 0 && searchTerm && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <TemplateIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Templates Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No templates match your search criteria. Try adjusting your search terms.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
