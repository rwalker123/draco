'use client';

import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { LeagueFaqType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import RichTextContent from '../common/RichTextContent';
import { EditIconButton, DeleteIconButton } from '../common/ActionIconButtons';

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
                    <EditIconButton
                      component="span"
                      tooltipTitle="Edit FAQ"
                      aria-label={`Edit ${faq.question}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(faq);
                      }}
                    />
                  )}
                  {onDelete && (
                    <DeleteIconButton
                      component="span"
                      tooltipTitle="Delete FAQ"
                      aria-label={`Delete ${faq.question}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(faq);
                      }}
                    />
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
