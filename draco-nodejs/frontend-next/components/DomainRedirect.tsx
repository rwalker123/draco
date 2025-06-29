import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Typography, 
  CircularProgress,
  Container
} from '@mui/material';

const DomainRedirect: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkDomain = async () => {
      try {
        console.log('DomainRedirect: Checking domain routing...');
        console.log('DomainRedirect: Current window.location.host:', window.location.host);
        
        // Use the full backend URL instead of relying on proxy
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/accounts/by-domain`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Host': window.location.host // Explicitly set the host header
          },
        });

        console.log('DomainRedirect: API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('DomainRedirect: API response data:', data);
          
          if (data.success) {
            console.log('DomainRedirect: Found account, redirecting to:', `/account/${data.data.account.id}/home`);
            // Redirect to the account home page
            router.push(`/account/${data.data.account.id}/home`);
            return;
          }
        }
        
        console.log('DomainRedirect: No account found or API failed, redirecting to /accounts');
        // If not found or not success, redirect to /accounts
        router.push('/accounts');
      } catch (err) {
        console.error('DomainRedirect: Error checking domain:', err);
        // On error, redirect to /accounts
        router.push('/accounts');
      } finally {
        setLoading(false);
      }
    };

    checkDomain();
  }, [router]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Checking domain routing...
        </Typography>
      </Container>
    );
  }

  // This should never render, as we always redirect
  return null;
};

export default DomainRedirect; 