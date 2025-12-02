import { Container, Stack, Typography } from '@mui/material';
import { DEFAULT_SITE_NAME, buildSeoMetadata } from '../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Privacy Policy | ${DEFAULT_SITE_NAME}`,
    description: `Learn how ${DEFAULT_SITE_NAME} collects, uses, and protects your data.`,
    path: '/privacy-policy',
    index: true,
  });
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Typography variant="h3" component="h1" fontWeight="bold">
            Privacy Policy
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We respect your privacy and handle personal information responsibly. This policy
            explains what we collect, how it is used, and the choices you have.
          </Typography>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Information We Collect
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Account details, contact information, usage data, and content you submit while using{' '}
            {DEFAULT_SITE_NAME}.
          </Typography>
          <Typography variant="h6" component="h2" fontWeight="bold">
            How We Use Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            To operate the platform, provide customer support, improve features, secure accounts,
            and communicate important updates.
          </Typography>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Your Choices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can update your account details, request data access or deletion where applicable,
            and manage communication preferences in your profile settings.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For questions about this policy, contact your organization administrator or the support
            team listed in your account materials.
          </Typography>
        </Stack>
      </Container>
    </main>
  );
}
