import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  Delete as DeleteIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import { EmailTemplate } from '../../../types/emails/email';

interface TemplateListViewProps {
  templates: EmailTemplate[];
  onEdit: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
  onDelete: (templateId: string) => void;
}

export default function TemplateListView({
  templates,
  onEdit,
  onPreview,
  onDelete,
}: TemplateListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: EmailTemplate) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTemplate(null);
  };

  const handleEdit = () => {
    if (selectedTemplate) {
      onEdit(selectedTemplate);
    }
    handleMenuClose();
  };

  const handlePreview = () => {
    if (selectedTemplate) {
      onPreview(selectedTemplate);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedTemplate) {
      onDelete(selectedTemplate.id.toString());
    }
    handleMenuClose();
  };

  // Filter templates based on search term
  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description &&
        template.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Extract variables from template content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{[^}]+\}\}/g);
    return matches ? matches.map((match) => match.replace(/[{}]/g, '').trim()) : [];
  };

  const formatDate = (date: Date | string | undefined | null) => {
    try {
      if (!date) return 'No date';

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date received:', date, typeof date);
        return 'No date';
      }

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', date);
      return 'No date';
    }
  };

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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {filteredTemplates.map((template) => {
          const subjectVariables = template.subjectTemplate
            ? extractVariables(template.subjectTemplate)
            : [];
          const bodyVariables = extractVariables(template.bodyTemplate);
          const allVariables = [...new Set([...subjectVariables, ...bodyVariables])];

          return (
            <Box
              key={template.id.toString()}
              sx={{
                flex: {
                  xs: '1 1 100%',
                  md: '1 1 calc(50% - 12px)',
                  lg: '1 1 calc(33.333% - 16px)',
                },
                minWidth: 300,
              }}
            >
              <Card
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
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, template)}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
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

                  {/* Body Preview */}
                  <Box sx={{ mb: 2, flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Content:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {template.bodyTemplate.replace(/<[^>]*>/g, '')}{' '}
                      {/* Strip HTML tags for preview */}
                    </Typography>
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
                      Updated {formatDate(template.updatedAt)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
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

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 160 },
        }}
      >
        <MenuItem onClick={handlePreview}>
          <PreviewIcon sx={{ mr: 1 }} />
          Preview
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
