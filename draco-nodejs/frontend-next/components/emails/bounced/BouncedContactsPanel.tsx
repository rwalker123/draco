'use client';

import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Block as BlockIcon,
  ClearOutlined as ClearIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { getBouncedContacts } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../utils/apiResult';
import { formatDateTime } from '../../../utils/dateUtils';
import ClearBounceDialog from './ClearBounceDialog';
import type { BouncedContact } from '../../../types/emails/bounced-contact';

interface BouncedContactsPanelProps {
  accountId: string;
  onCountLoaded?: (count: number) => void;
}

const BouncedContactsPanel: React.FC<BouncedContactsPanelProps> = ({
  accountId,
  onCountLoaded,
}) => {
  const apiClient = useApiClient();
  const [contacts, setContacts] = useState<BouncedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedContact, setSelectedContact] = useState<BouncedContact | null>(null);

  useEffect(() => {
    if (!accountId) return;

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getBouncedContacts({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult(result, 'Failed to load bounced contacts');
        setContacts(data.contacts);
        onCountLoaded?.(data.contacts.length);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load bounced contacts');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, refreshKey, onCountLoaded]);

  const handleCleared = () => {
    setSelectedContact(null);
    setRefreshKey((k) => k + 1);
  };

  if (loading || (contacts.length === 0 && !error)) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BlockIcon fontSize="small" color="warning" />
            <Typography variant="subtitle1">Blocked Email Addresses ({contacts.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <Box sx={{ px: 2, pb: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These contacts have bounced email addresses and will be skipped in future sends.
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={() => setRefreshKey((k) => k + 1)}>
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            )}

            {contacts.length > 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Bounced On</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id} hover>
                        <TableCell>
                          {contact.firstName} {contact.lastName}
                        </TableCell>
                        <TableCell>{contact.email ?? '—'}</TableCell>
                        <TableCell>{formatDateTime(new Date(contact.emailBouncedAt))}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Clear bounce">
                            <span>
                              <IconButton size="small" onClick={() => setSelectedContact(contact)}>
                                <ClearIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      <ClearBounceDialog
        open={Boolean(selectedContact)}
        accountId={accountId}
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onCleared={handleCleared}
      />
    </Box>
  );
};

export default BouncedContactsPanel;
