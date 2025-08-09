'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Contact, EmailMode } from '../../../types/emails/email';
import { getContactDisplayName } from '../common/mailtoUtils';

interface EmailQuickDialogProps {
  open: boolean;
  onClose: () => void;
  contact: Contact;
  onSend: (mode: EmailMode, subject?: string, body?: string) => void;
}

export function EmailQuickDialog({ open, onClose, contact, onSend }: EmailQuickDialogProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<EmailMode>('mailto');

  const handleSend = () => {
    onSend(mode, subject.trim() || undefined, body.trim() || undefined);
    // Clear form
    setSubject('');
    setBody('');
  };

  const handleClose = () => {
    setSubject('');
    setBody('');
    onClose();
  };

  const contactName = getContactDisplayName(contact);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' },
      }}
    >
      <DialogTitle>Send Email</DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            To:
          </Typography>
          <Chip label={`${contactName} (${contact.email})`} color="primary" variant="outlined" />
        </Box>

        <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
          <FormLabel component="legend">Email Method</FormLabel>
          <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as EmailMode)} row>
            <FormControlLabel
              value="mailto"
              control={<Radio />}
              label="Quick Email (opens your email app)"
            />
            <FormControlLabel
              value="advanced"
              control={<Radio />}
              label="Advanced (coming soon)"
              disabled
            />
          </RadioGroup>
        </FormControl>

        <TextField
          fullWidth
          label="Subject (optional)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          margin="normal"
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Message (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          margin="normal"
          variant="outlined"
          multiline
          rows={4}
          helperText={mode === 'mailto' ? 'This will open in your default email application' : ''}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSend} variant="contained" color="primary">
          {mode === 'mailto' ? 'Open Email App' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
