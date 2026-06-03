import { Container, Typography, Button, Box } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        🐾 Pet Care Reminder
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track medications, vet visits, and care tasks for your pets.
        Never miss a dose again.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button href="/register" variant="contained" size="large">
          Get Started
        </Button>
        <Button href="/login" variant="outlined" size="large">
          Sign In
        </Button>
      </Box>
    </Container>
  );
}
