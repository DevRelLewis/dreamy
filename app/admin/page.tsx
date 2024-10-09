'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppShell,
  AppShellHeader,
  AppShellNavbar,
  AppShellMain,
  Title,
  LoadingOverlay,
  Container,
  Button,
  Stack,
  Group,
  Notification,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { createClient } from '@supabase/supabase-js';
import StatsCard from '@/components/StatsCard/StatsCard';

const AdminSettings = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubscribers: 0,
    totalSessions: 0,
    totalTokensSpent: 0,
  });
  const router = useRouter();
  
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setIsAdmin(false);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error || !data) {
          console.error('Error fetching admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data.is_admin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [supabase]);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    } else if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin, isLoading, router]);

  const fetchStats = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch total subscribers
      const { count: totalSubscribers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_subscribed', true);

      // Fetch total sessions
      const { count: totalSessions } = await supabase
        .from('dream_sessions')
        .select('*', { count: 'exact', head: true });

      // Fetch total tokens spent
      const { data: users, error } = await supabase
        .from('users')
        .select('token_transactions');

      if (error) {
        throw error;
      }

      let totalTokensSpent = 0;
      users.forEach(user => {
        if (user.token_transactions && Array.isArray(user.token_transactions)) {
          user.token_transactions.forEach((transaction: { amount: number }) => {
            totalTokensSpent += Math.abs(transaction.amount);
          });
        }
      });

      setStats({
        totalUsers: totalUsers || 0,
        totalSubscribers: totalSubscribers || 0,
        totalSessions: totalSessions || 0,
        totalTokensSpent,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} />;
  }

  if (!isAdmin) {
    return null; // Non-admin users are redirected
  }

  return (
    <AppShell padding="md">
      <AppShellHeader p="xs">
        <Title order={3}>Admin Dashboard</Title>
      </AppShellHeader>

      <AppShellNavbar p="xs" zIndex={-1} style={{paddingTop: 75, background: 'blue', color: 'white'}}>
        <Button variant="subtle" fullWidth mt="md">
          Dashboard
        </Button>
        <Button variant="subtle" fullWidth mt="sm">
          User Management
        </Button>
        <Button variant="subtle" fullWidth mt="sm">
          Reports
        </Button>
      </AppShellNavbar>

      <AppShellMain>
        <Container>
          <Stack>
            <Title order={4}>Key Metrics</Title>
            <Group>
              <StatsCard title="Total Users" stat={stats.totalUsers} />
              <StatsCard title="Total Subscribers" stat={stats.totalSubscribers} />
              <StatsCard title="Total Sessions" stat={stats.totalSessions} />
              <StatsCard title="Total Tokens Spent" stat={stats.totalTokensSpent} />
            </Group>

            {successMessage && (
              <Notification
                icon={<IconCheck size={18} />}
                color="teal"
                title="Success"
                onClose={() => setSuccessMessage('')}
              >
                {successMessage}
              </Notification>
            )}
          </Stack>
        </Container>
      </AppShellMain>
    </AppShell>
  );
};

export default AdminSettings;