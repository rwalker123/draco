'use client';

import { useState } from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { Contact, EmailMode } from '../../../types/emails/email';
import { generateContactMailto, hasValidEmail } from './mailtoUtils';
import { EmailQuickDialog } from '../dialogs/EmailQuickDialog';

interface EmailButtonProps {
  contact: Contact;
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  disabled?: boolean;
  onEmailSent?: () => void;
}

export function EmailButton({
  contact,
  variant = 'icon',
  size = 'small',
  className,
  disabled = false,
  onEmailSent,
}: EmailButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasEmail = hasValidEmail(contact);
  const isDisabled = disabled || !hasEmail;

  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDisabled) return;

    // Open quick email dialog
    setDialogOpen(true);
  };

  const handleQuickEmail = (mode: EmailMode, subject?: string, body?: string) => {
    if (mode === 'mailto') {
      // Open in default email client
      const mailtoUrl = generateContactMailto(contact, subject, body);
      window.location.href = mailtoUrl;
    } else {
      // TODO: Open advanced email composer
      console.log('Advanced email mode not yet implemented');
    }

    setDialogOpen(false);
    onEmailSent?.();
  };

  const buttonContent = (
    <>
      {variant === 'button' ? (
        <Button
          variant="outlined"
          size={size}
          startIcon={<EmailIcon />}
          onClick={handleEmailClick}
          disabled={isDisabled}
          className={className}
        >
          Email
        </Button>
      ) : (
        <IconButton
          size={size}
          onClick={handleEmailClick}
          disabled={isDisabled}
          className={className}
        >
          <EmailIcon fontSize={size === 'small' ? 'small' : 'medium'} />
        </IconButton>
      )}
    </>
  );

  const content = isDisabled ? (
    <Tooltip title={!hasEmail ? 'No email address available' : 'Email disabled'} placement="top">
      <span>{buttonContent}</span>
    </Tooltip>
  ) : (
    <Tooltip title={`Email ${contact.firstname} ${contact.lastname}`} placement="top">
      <span>{buttonContent}</span>
    </Tooltip>
  );

  return (
    <>
      {content}
      <EmailQuickDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        contact={contact}
        onSend={handleQuickEmail}
      />
    </>
  );
}
