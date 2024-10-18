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
import { signIn } from 'next-auth/react'
import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";


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

        <LoginLink postLoginRedirectURL="/chat">Sign in</LoginLink>
        </Paper>
      </Container>
    </Center>
  );
};

export default AuthForm;