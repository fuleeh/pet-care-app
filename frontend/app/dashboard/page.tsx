'use client';

import { Container, Typography, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth-store';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, clear } = useAuthStore();

  useEffect(() => {
    if (!accessToken) router.push('/login');
  }, [accessToken, router]);

  if (!accessToken) return null;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button variant="outlined" color="error" onClick={() => { clear(); router.push('/'); }}>
          Sign Out
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary">
        Welcome to your pet care dashboard. Coming soon.
      </Typography>
    </Container>
  );
}
