'use client';

import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Stack,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import type { LeagueFaqType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';

interface LeagueFaqListProps {
  faqs: LeagueFaqType[];
  onEdit?: (faq: LeagueFaqType) => void;
  onDelete?: (faq: LeagueFaqType) => void;
}

export const LeagueFaqList: React.FC<LeagueFaqListProps> = ({ faqs, onEdit, onDelete }) => {
  return (
    <WidgetShell title="Frequently Asked Questions" accent="primary">
      <Stack spacing={2}>
        {faqs.map((faq) => (
          <Accordion key={faq.id} disableGutters elevation={1}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {faq.question}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {onEdit && (
                    <Tooltip title="Edit FAQ">
                      <IconButton
                        component="span"
                        size="small"
                        aria-label={`Edit ${faq.question}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(faq);
                        }}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip title="Delete FAQ">
                      <IconButton
                        component="span"
                        size="small"
                        aria-label={`Delete ${faq.question}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(faq);
                        }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  '& .editor-text-bold': { fontWeight: 'bold' },
                  '& .editor-text-italic': { fontStyle: 'italic' },
                  '& .editor-text-underline': { textDecoration: 'underline' },
                  '& .editor-list-ul': {
                    listStyleType: 'disc',
                    margin: 0,
                    paddingLeft: '20px',
                  },
                  '& .editor-list-ol': {
                    listStyleType: 'decimal',
                    margin: 0,
                    paddingLeft: '20px',
                  },
                  '& .editor-list-item': { margin: '4px 0' },
                  '& .editor-heading-h1': {
                    fontSize: '2em',
                    fontWeight: 'bold',
                    margin: '16px 0 8px 0',
                  },
                  '& .editor-heading-h2': {
                    fontSize: '1.5em',
                    fontWeight: 'bold',
                    margin: '14px 0 6px 0',
                  },
                  '& .editor-heading-h3': {
                    fontSize: '1.2em',
                    fontWeight: 'bold',
                    margin: '12px 0 6px 0',
                  },
                  '& .editor-heading-h4': {
                    fontSize: '1.1em',
                    fontWeight: 'bold',
                    margin: '10px 0 4px 0',
                  },
                  '& .editor-heading-h5': {
                    fontSize: '1em',
                    fontWeight: 'bold',
                    margin: '8px 0 4px 0',
                  },
                  '& .editor-heading-h6': {
                    fontSize: '0.9em',
                    fontWeight: 'bold',
                    margin: '8px 0 4px 0',
                  },
                }}
                component="div"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </WidgetShell>
  );
};

export default LeagueFaqList;
