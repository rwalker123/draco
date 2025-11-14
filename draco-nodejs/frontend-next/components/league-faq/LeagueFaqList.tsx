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
import RichTextContent from '../common/RichTextContent';

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
              <RichTextContent html={faq.answer ?? ''} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </WidgetShell>
  );
};

export default LeagueFaqList;
