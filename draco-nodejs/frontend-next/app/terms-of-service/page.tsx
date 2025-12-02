import { Container, Stack, Typography } from '@mui/material';
import { DEFAULT_SITE_NAME, buildSeoMetadata } from '../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Terms of Service | ${DEFAULT_SITE_NAME}`,
    description: `Review the terms that govern your use of ${DEFAULT_SITE_NAME}.`,
    path: '/terms-of-service',
    index: true,
  });
}

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background">
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Typography variant="h3" component="h1" fontWeight="bold">
            Terms of Service
          </Typography>
          <Typography variant="body1" color="text.secondary">
            These terms govern your use of {DEFAULT_SITE_NAME}. By accessing the platform, you agree
            to follow these rules and any policies referenced here.
          </Typography>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Acceptable Use
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the platform for lawful league and team management activities. Do not misuse access,
            disrupt services, or infringe on the rights of others.
          </Typography>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Accounts & Access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keep your credentials secure and notify your administrator of any unauthorized use. Role
            permissions are managed by your organization.
          </Typography>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Content & Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You are responsible for the accuracy of content you submit. We may process and display
            information as needed to operate the service.
          </Typography>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Changes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We may update these terms; continued use after changes means you accept the updated
            terms. Material changes will be communicated through the platform.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For questions about these terms, contact your organization administrator or the support
            team listed in your account materials.
          </Typography>
        </Stack>
      </Container>
    </main>
  );
}
