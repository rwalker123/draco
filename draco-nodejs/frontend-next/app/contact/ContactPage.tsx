'use client';

import React, { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';

const ContactFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

type ContactFormValues = z.infer<typeof ContactFormSchema>;

const ContactPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { notification, showNotification, hideNotification } = useNotifications();

  const formResolver = zodResolver(ContactFormSchema) as Resolver<ContactFormValues>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: formResolver,
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (_values: ContactFormValues) => {
    hideNotification();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showNotification("Thank you for your message! We'll get back to you soon.", 'success');
      reset();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-background">
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <IconButton
            onClick={handleHomeClick}
            sx={{ alignSelf: 'flex-start' }}
            aria-label="back to home"
          >
            <HomeIcon />
          </IconButton>

          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <Stack spacing={3}>
              <Typography variant="h4" component="h1">
                Contact Us
              </Typography>

              <Typography variant="body1" color="text.secondary">
                Have questions? We&apos;d love to hear from you.
              </Typography>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={2}>
                  <TextField
                    label="Name"
                    fullWidth
                    required
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                    {...register('name')}
                  />

                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    {...register('email')}
                  />

                  <TextField
                    label="Subject"
                    fullWidth
                    error={Boolean(errors.subject)}
                    helperText={errors.subject?.message}
                    {...register('subject')}
                  />

                  <TextField
                    label="Message"
                    fullWidth
                    required
                    multiline
                    rows={4}
                    error={Boolean(errors.message)}
                    helperText={errors.message?.message}
                    {...register('message')}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Paper>
        </Stack>
      </Container>
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={hideNotification} severity={notification?.severity} variant="filled">
          {notification?.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default ContactPage;
