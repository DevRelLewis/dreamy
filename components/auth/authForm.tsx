'use client'
import React, { useState } from 'react';
import {
  Button,
  TextInput,
  PasswordInput,
  Paper,
  Text,
  Group,
  Stack,
  Alert,
  Center,
  Container,
  useMantineTheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/supabaseClient';
import { useMediaQuery } from '@mantine/hooks';

type AuthMode = 'signIn' | 'signUp';

const AuthForm: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'signIn' ? 'signUp' : 'signIn');
    setError(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMode === 'signUp') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });

        if (error) throw error;

        notifications.show({
          title: 'Sign Up Successful',
          message: 'Please check your email to confirm your account.',
          color: 'green',
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        notifications.show({
          title: 'Sign In Successful',
          message: 'You have successfully signed in.',
          color: 'green',
        });

        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.message);
      notifications.show({
        title: `${authMode === 'signIn' ? 'Sign In' : 'Sign Up'} Error`,
        message: err.message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/chat`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      notifications.show({
        title: 'Google Sign In Error',
        message: err.message,
        color: 'red',
      });
    }
  };

  return (
    <Center h="100vh" p={isMobile ? 'xs' : 'md'}>
      <Container size={isMobile ? '100%' : 'xs'} p={0}>
        <Paper radius="md" p={isMobile ? 'sm' : 'xl'} withBorder>
          <Text size={isMobile ? 'md' : 'lg'} fw={500} ta="center" mb="md">
            {authMode === 'signIn' ? 'Welcome Back!' : 'Create an Account'}
          </Text>

          {error && (
            <Alert title="Error" color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleAuth}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />
              <Button type="submit" fullWidth loading={loading} color="teal">
                {authMode === 'signIn' ? 'Sign In' : 'Sign Up'}
              </Button>
            </Stack>
          </form>

          <Group justify="space-between" mt="md">
            <Text size="sm">
              {authMode === 'signIn'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </Text>
            <Button
              variant="subtle"
              onClick={toggleAuthMode}
              size="xs"
              color="teal"
            >
              {authMode === 'signIn' ? 'Sign Up' : 'Sign In'}
            </Button>
          </Group>

          <Button
            variant="outline"
            color="gray"
            fullWidth
            mt="md"
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>
        </Paper>
      </Container>
    </Center>
  );
};

export default AuthForm;