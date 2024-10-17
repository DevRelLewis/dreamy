'use client'
import React, { useState } from 'react';
import {
  Button,
  Box,
  Paper,
  Text,
  Flex,
  Alert,
  Center,
  Container,
  useMantineTheme,
  Image,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/supabaseClient';
import { useMediaQuery } from '@mantine/hooks';
import dreamsanbg from '../../app/public/dream-san-bg-t-2.png'
import google from '../../app/public/google.png'
import apple from "../../app/public/apple.png"
import twitter from "../../app/public/twitter.png"
import NextImage from 'next/image'

type AuthMode = 'signIn' | 'signUp';

const AuthForm: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const theme = useMantineTheme();
  const isMobileOrTablet = useMediaQuery('(max-width: 1024px)');
  const isNarrowMobile = useMediaQuery('(max-width: 320px)');

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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

  const handleAppleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      notifications.show({
        title: 'Apple Sign In Error',
        message: err.message,
        color: 'red',
      });
    }
  };

  const handleXSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      notifications.show({
        title: 'X Sign In Error',
        message: err.message,
        color: 'red',
      });
    }
  };

  return (
    <Center 
      h="100vh" 
      p={isMobileOrTablet ? 'xs' : 'lg'} 
      style={{
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #ffd54f 0%, #ff8a65 25%, #7e57c2 50%, #5c6bc0 75%, #42a5f5 100%)'
      }}
    >
      {!isMobileOrTablet && (
        <Box
          style={{
            marginLeft: -20,
            width: '50vw', 
            height: '100vh', 
            display: 'flex',
            justifyContent: 'flex-start', 
            alignItems: 'flex-start',
          }}
        >
          <Image
            component={NextImage}
            h='100vh'
            width={1200}
            src={dreamsanbg}
            alt="dreamsanbg"
            style={{
              margin: 0,
              padding: 0,
              display: 'block', 
            }}
          />
        </Box>
      )}
      <Container 
        size={isMobileOrTablet ? '100%' : 'xs'} 
        p={0}
        style={{
          width: isMobileOrTablet ? '100%' : '50%',
        }}
      >
        <Paper radius="md" p={isMobileOrTablet ? 'sm' : 'xl'} bg="rgba(179, 229, 252, 0.8)">
          <Text size={isMobileOrTablet ? (isNarrowMobile ? 'sm' : 'md') : '35px'} fw={500} ta="center" mb="md">
            {authMode === 'signIn' ? 'Welcome to Dream-San' : 'Create an Account'}
          </Text>
          <Text size={isMobileOrTablet ? (isNarrowMobile ? 'xs' : 'sm') : '25px'} fw={500} ta="center" mb="md">Your AI Dream Interpreter</Text>

          {error && (
            <Alert title="Error" color="red" mb="md">
              {error}
            </Alert>
          )}

          <Button
            variant="outline"
            color="black"
            radius={24}
            fullWidth
            mt="md"
            size={isMobileOrTablet ? 'sm' : 'lg'}
            bg='#d1c4e9'
            onClick={handleGoogleSignIn}
          >
            <Flex direction='row' gap={10} align='center'>
              <Image
                component={NextImage}
                h={isMobileOrTablet ? 25 : 30}
                w={isMobileOrTablet ? 25 : 30}
                src={google}
                alt="Google logo"
              />
              <Text size={isMobileOrTablet ? (isNarrowMobile ? 'md' : 'lg') : '40px'}>
                Continue with Google
              </Text>
            </Flex>
          </Button>
          <Button
            variant="outline"
            color="black"
            radius={24}
            fullWidth
            mt="md"
            size={isMobileOrTablet ? 'sm' : 'lg'}
            bg='#d1c4e9'
            onClick={handleAppleSignIn}
          >
            <Flex direction='row' gap={10} align='center'>
              <Image
                component={NextImage}
                h={isMobileOrTablet ? 25 : 30}
                w={isMobileOrTablet ? 25 : 30}
                src={apple}
                alt="Apple logo"
              />
              <Text size={isMobileOrTablet ? (isNarrowMobile ? 'md' : 'lg') : '40px'}>
                Continue with Apple
              </Text>
            </Flex>
          </Button>
          <Button
            variant="outline"
            color="black"
            radius={24}
            fullWidth
            mt="md"
            size={isMobileOrTablet ? 'sm' : 'lg'}
            bg='#d1c4e9'
            onClick={handleXSignIn}
          >
            <Flex direction='row' gap={10} align='center'>
              <Image
                component={NextImage}
                h={isMobileOrTablet ? 25 : 30}
                w={isMobileOrTablet ? 25 : 30}
                src={twitter}
                alt="Apple logo"
              />
              <Text size={isMobileOrTablet ? (isNarrowMobile ? 'md' : 'lg') : '40px'}>
                Continue with X
              </Text>
            </Flex>
          </Button>
        </Paper>
      </Container>
    </Center>
  );
};

export default AuthForm;