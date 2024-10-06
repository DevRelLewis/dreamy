'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  TextInput,
  Button,
  Paper,
  Text,
  ScrollArea,
  Group,
  Loader,
  ThemeIcon,
  MantineProvider,
  AppShell,
  Avatar,
  rem,
  createTheme,
  Menu,
  Stack,
  Modal,
  Card,
  Image,
  Center,
  AppShellNavbar,
  Burger,
  Flex
} from '@mantine/core';
import { IconSend, IconMessageCircle, IconMenu2 } from '@tabler/icons-react';
import { supabase } from '../../supabase/supabaseClient';
import { Notifications, notifications } from '@mantine/notifications';
import cloudheart from "../public/cloudheart.jpg"
import NextImage from 'next/image'
import { motion, AnimatePresence } from 'framer-motion';
import { Lobster } from 'next/font/google';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import { processTokenTransaction } from '../../components/token system/TokenSystem';
import { hasEnoughTokens, estimateTokenCost } from '../../components/utils/token utils/TokenUtility';

const lobster = Lobster({ weight: '400', subsets: ['latin'] })

type Message = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    id: string;
    email: string;
  };
};

type UserData = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  token_balance: number;
  tokens_spent: number;
  is_subscribed: boolean;
};

type DreamSession = {
  id: string;
  dream_text: string;
  created_at: string;
};

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Segoe UI, sans-serif',
  white: '#ffffff',
  black: '#202124',
  components: {
    Button: {
      styles: (theme: any) => ({
        root: {
          borderRadius: theme.radius.md,
          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
          backgroundColor: '#8da0cb',
          color: theme.white,
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease',

          '&:hover': {
            backgroundColor: '#7a8bbd',
            boxShadow: theme.shadows.md,
          },

          '&:disabled': {
            backgroundColor: '#a1b1d6',
            color: '#e0e0e0',
          },
        },
      }),
    },
    TextInput: {
      styles: (theme: any) => ({
        root: { flex: 2 },
        input: {
          borderRadius: theme.radius.md, 
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          color: theme.black,
          '&::placeholder': {
            color: 'rgba(0, 0, 0, 0.5)',
          },
          '&:focus': {
            borderColor: theme.colors.blue[6],
          },
        },
      }),
    },
  },
});

const checkOrCreateUser = async (authUser: any): Promise<UserData | null> => {
  // Check if user exists in the users table
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', authUser.email)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking user:', error);
    return null;
  }

  if (data) {
    // User exists, return their data
    return data as UserData;
  } else {
    // User doesn't exist, create new user
    const newUser = {
      id: authUser.id,
      first_name: authUser.user_metadata?.first_name || '',
      last_name: authUser.user_metadata?.last_name || '',
      email: authUser.email,
      token_balance: 250,
      tokens_spent: 0,
      is_subscribed: false // Default to false for new users
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return null;
    }

    return newUser;
  }
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState<boolean>(true);
  const [isToppedUp, setIsToppedUp] = useState<boolean>(false);
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState<number | null>(null);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);
  const [opened, { toggle }] = useDisclosure();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dreamHistory, setDreamHistory] = useState<DreamSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const truncateTitle = (title: string) => {
    const words = title.split(' ');
    return words.length > 4 ? words.slice(0, 4).join(' ') + '...' : title;
  };

  const router = useRouter();

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear any user-related state

    // Show a notification
    notifications.show({
      title: 'Logged Out',
      message: 'You have been successfully logged out.',
      color: 'blue',
    });

    // Redirect to the home page
    router.push('/');
  } catch (error) {
    console.error('Error during logout:', error);
    notifications.show({
      title: 'Logout Error',
      message: 'An error occurred during logout. Please try again.',
      color: 'red',
    });
  }
};

const handleManageSubscription = () => {
  setIsLoading(true);
  try {
    // Redirect to the Stripe billing portal
    window.location.href = 'https://billing.stripe.com/p/login/test_4gw29Sez273BcyQcMM';
  } catch (error) {
    console.error('Error redirecting to subscription management:', error);
    notifications.show({
      title: 'Error',
      message: 'Failed to open subscription management page. Please try again.',
      color: 'red',
    });
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    const fetchUserAndData = async () => {
      setLoading(true);
      
      try {
        // Get the current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setCurrentUserId(user.id);
          
          // Check if user exists in the users table or create a new entry
          const userData = await checkOrCreateUser(user);
          if (userData) {
            setUserData(userData);
            // Set the subscription status based on the is_subscribed field
            setIsSubscriptionActive(userData.is_subscribed);
          }

          // Fetch dream history
          const { data: dreamHistoryData, error: dreamHistoryError } = await supabase
            .from('dream_sessions')
            .select('id, dream_text, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (dreamHistoryError) {
            throw dreamHistoryError;
          }

          setDreamHistory(dreamHistoryData || []);

          // Don't automatically set active session or load messages
          setActiveSessionId(null);
          setMessages([]);

        } else {
          // Handle case where there is no authenticated user
          console.log('No authenticated user found');
          setCurrentUserId(null);
          setUserData(null);
          setIsSubscriptionActive(false);
          setMessages([]);
          setDreamHistory([]);
          setActiveSessionId(null);
        }
      } catch (error) {
        console.error('Error fetching user data and history:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load user data and dream history.',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();

    // Cleanup function
    return () => {
      // No cleanup needed in this case
    };
  }, []);

  const loadDreamSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('dream_sessions')
        .select('dream_text, interpretation')
        .eq('id', sessionId)
        .single();
  
      if (sessionError) {
        throw sessionError;
      }
  
      if (sessionData) {
        const formattedMessages: Message[] = [
          {
            id: 'user-message',
            content: sessionData.dream_text,
            user_id: currentUserId!,
            created_at: new Date().toISOString(),
            user: { id: currentUserId!, email: userData?.email || '' },
          },
          {
            id: 'assistant-message',
            content: sessionData.interpretation,
            user_id: 'assistant',
            created_at: new Date().toISOString(),
            user: { id: 'assistant', email: 'assistant@example.com' },
          },
        ];
        setMessages(formattedMessages);
        setActiveSessionId(sessionId);
      }
    } catch (error) {
      console.error('Error loading dream session:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load dream session.',
        color: 'red',
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };


  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    setSending(true);
  
    if (!currentUserId || !userData) {
      notifications.show({
        title: 'Unauthorized',
        message: 'You must be signed in to send messages.',
        color: 'red',
      });
      setSending(false);
      return;
    }
  
    try {
      // Process token transaction
      const transactionSuccess = await processTokenTransaction(currentUserId, newMessage);
      if (!transactionSuccess) {
        throw new Error('Insufficient tokens');
      }
  
      // Send message to API
      const response = await fetch('/api/dreamy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: newMessage, 
          userId: currentUserId,
          sessionId: activeSessionId 
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to get assistant response');
      }
  
      const data = await response.json();
  
      // Add user message and assistant's response to the UI
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: newMessage,
          user_id: currentUserId,
          created_at: new Date().toISOString(),
          user: { id: currentUserId, email: userData.email },
        },
        {
          id: (Date.now() + 1).toString(),
          content: data.reply,
          user_id: 'assistant',
          created_at: new Date().toISOString(),
          user: { id: 'assistant', email: 'assistant@example.com' },
        }
      ]);
  
      // Set the active session ID
      setActiveSessionId(data.sessionId);
  
      // Update user's token balance in the UI
      const tokenCost = estimateTokenCost(newMessage);
      setUserData(prevData => ({
        ...prevData!,
        token_balance: prevData!.token_balance - tokenCost
      }));
  
      // Refresh dream history
      await refreshDreamHistory();
  
      // Clear input and scroll to bottom
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      if (error instanceof Error) {
        if (error.message === 'Insufficient tokens') {
          notifications.show({
            title: 'Insufficient Tokens',
            message: 'You do not have enough tokens for this query. Please top up your tokens.',
            color: 'yellow',
          });
          setIsTopUpModalOpen(true);
        } else {
          notifications.show({
            title: 'Error',
            message: 'Failed to send message or get response.',
            color: 'red',
          });
        }
      }
    } finally {
      setSending(false);
    }
  };
  
  const refreshDreamHistory = async () => {
    const { data: newHistory, error } = await supabase
      .from('dream_sessions')
      .select('id, dream_text, created_at')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(10);
  
    if (!error) {
      setDreamHistory(newHistory || []);
    } else {
      console.error('Error refreshing dream history:', error);
    }
  };

  const handleTopUp = (amount: number) => {
    setSelectedTopUpAmount(amount);
    setIsToppedUp(true);
  };

  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <AppShell
        padding="md"
        header={{ height: 60 }}
        navbar={{
          width: 250,
          breakpoint: 'sm',
          collapsed: { desktop: !desktopOpened, mobile: !mobileOpened },
        }}
        styles={(theme) => ({
          header: {
            backgroundColor: 'rgba(179, 229, 252, 0.8)',
            borderBottom: '1px solid #9fa8da'
          },
          main: {
            background: 'linear-gradient(135deg, #e0f7fa 0%, #b3e5fc 25%, #9fa8da 50%, #b39ddb 75%, #d1c4e9 100%)'
          },
        })}
      >
        <AppShell.Header>
          <Container size="xxl" h="100%" w="100%">
            <Group justify="space-between" h="100%" w="100%">
              <Group>
                <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
                <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="md" size="sm" />
                <Text
                  className={lobster.className}
                  size="xl"
                  fw={700}
                  style={{
                    background: 'linear-gradient(315deg, #b3e5fc 0%, #9fa8da 50%, #b39ddb 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent',
                    display: 'inline-block',
                    marginLeft: isMobile ? '60px' : '0',
                  }}
                >
                  Dream-San
                </Text>
              </Group>
              <Menu>
                <Menu.Target>
                  <div
                    style={{
                      display: 'inline-block',
                      borderRadius: '60%',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      const avatar = e.currentTarget.firstElementChild as HTMLElement;
                      if (avatar) {
                        avatar.style.boxShadow = `
                          0 0 20px 10px rgba(255, 255, 255, 0.8),
                          0 0 40px 20px rgba(255, 255, 255, 0.6),
                          0 0 60px 30px rgba(255, 255, 255, 0.4),
                          0 0 80px 40px rgba(255, 255, 255, 0.2),
                          0 0 100px 50px rgba(255, 255, 255, 0.1)
                        `;
                        avatar.style.border = '2px solid rgba(255, 255, 255, 1)';
                        avatar.style.fontWeight = '700';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const avatar = e.currentTarget.firstElementChild as HTMLElement;
                      if (avatar) {
                        avatar.style.boxShadow = 'none';
                        avatar.style.border = '2.5px solid rgba(255, 255, 255, 0.2)';
                        avatar.style.fontWeight = '400';
                      }
                    }}
                  >
                    <Avatar 
                      color="white" 
                      radius="xl" 
                      style={{
                        transition: 'all 0.2s ease-in-out',
                        cursor: 'pointer',
                      }}
                    >
                      <Text size='25px'>
                        {userData?.first_name ? userData.first_name[0].toUpperCase() : 'U'}
                      </Text>
                    </Avatar>
                  </div>
                </Menu.Target>
                <Menu.Dropdown>
                <Menu.Label>
                  <Text size='xl'>User: {userData?.first_name} {userData?.last_name}</Text>
                </Menu.Label>
                <Menu.Label>
                  <Flex direction='row' align='center'>
                    <Text size='xl'>Token Balance: {userData?.token_balance}</Text>
                  </Flex>
                </Menu.Label>
                <Menu.Label>
                  <Flex direction='row' align='center'>
                    <Text size='xl'>Subscribed: {' '}</Text>
                      <Text size='xl' span c={userData?.is_subscribed ? "green" : "red"} fw={600}>
                        {userData?.is_subscribed ? 'Yes' : 'No'}
                      </Text>
                    </Flex>
                </Menu.Label>
                  <Menu.Item onClick={() => setIsSubscriptionModalOpen(true)}>
                   <Text size='xl'>Manage Subscription</Text> 
                  </Menu.Item>
                  <Menu.Item>
                    <Stack align="center">
                      <Button 
                        variant="light" 
                        size='lg'
                        fullWidth
                        onClick={() => setIsTopUpModalOpen(true)}
                        styles={(theme) => ({
                          root: {
                            '&:hover': {
                              backgroundColor: theme.colors.blue[2],
                            },
                          },
                        })}
                      >
                        <Text size='30px'>Top Up</Text>
                      </Button>
                    </Stack>
                  </Menu.Item>
                  <Menu.Item>
                    <Button 
                      onClick={handleLogout}
                      fullWidth 
                      size="lg" 
                      color="red"
                      styles={(theme) => ({
                        root: {
                          backgroundColor: theme.colors.red[6],
                          '&:hover': {
                            backgroundColor: theme.colors.red[7],
                          },
                        },
                      })}
                    >
                      <Text span size="30px" fw={700}>Logout</Text>
                    </Button>
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Container>
        </AppShell.Header>
        <AppShell.Navbar
        p="md"
        style={{
          backgroundColor: 'rgba(179, 229, 252, 0.8)',
          borderRight: '1px solid #9fa8da',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <AppShell.Section grow>
          <Text size="xl" fw={700} mb={15} c="black">
            Dream History
          </Text>
          <Button 
            onClick={() => {
              setActiveSessionId(null);
              setMessages([]);
            }} 
            fullWidth 
            mb={15}
            >
            Start New Dream Session
          </Button>
          <ScrollArea h="calc(100% - 60px)" type="never">
            {dreamHistory.map((dream) => (
              <Button
                key={dream.id}
                variant="subtle"
                fullWidth
                styles={{
                  root: {
                    justifyContent: 'flex-start',
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    height: 'auto',
                    minHeight: 36,
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                  },
                  label: {
                    color: 'black',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    textAlign: 'left',
                  },
                }}
                onClick={() => {loadDreamSession(dream.id)}}
              >
                <Stack>
                  <Text size="sm" fw={700}>
                    {new Date(dream.created_at).toLocaleDateString()}
                  </Text>
                  <Text size="xs">
                    {truncateTitle(dream.dream_text)}
                  </Text>
                </Stack>
              </Button>
            ))}
          </ScrollArea>
        </AppShell.Section>
      </AppShell.Navbar>
        <AppShell.Main>
          <Container size="md" py="xl">
            <Paper 
              shadow="lg" 
              radius="md" 
              p="md" 
              style={{ 
                height: 'max(80vh, calc(100vh - 160px))', 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '1rem',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <ScrollArea style={{ flex: 1, marginBottom: '1rem' }}>
                {loading ? (
                  <Group justify="center" mt="xl">
                    <Loader color="black" />
                  </Group>
                ) : (
                  messages.map((msg) => (
                    <Group
                      key={msg.id}
                      justify={msg.user_id === currentUserId ? 'flex-end' : 'flex-start'}
                      gap="xs"
                      mb="xs"
                    >
                      {msg.user_id !== currentUserId && (
                        <ThemeIcon color="teal" radius="xl">
                          <IconMessageCircle size={rem(16)} />
                        </ThemeIcon>
                      )}
                      <Paper
                        radius="md"
                        p="xs"
                        bg={msg.user_id === currentUserId ? 'dark.4' : 'dark.5'}
                      >
                        <Text size="sm">{msg.content}</Text>
                      </Paper>
                    </Group>
                  ))
                )}
                <div ref={scrollRef} />
              </ScrollArea>
              <Group align="flex-end" w="100%">
                <TextInput
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.currentTarget.value)}
                  style={{ width: '100%' }}
                  disabled={sending}
                />
                <Button
                  color="#999999"
                  onClick={handleSendMessage}
                  loading={sending}
                  disabled={sending}
                  size="sm"
                  style={{ flex: 0.2 }}
                >
                  <Text>☁️ Send</Text>
                </Button>
              </Group>
            </Paper>
          </Container>
        </AppShell.Main>

        <Modal
          opened={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          title="Manage Subscription"
        >
          <Stack>
            {isSubscriptionActive ? (
              <Text>You're all set, no activation needed.</Text>
            ) : (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Image
                    component={NextImage}
                    src={cloudheart}
                    height={310}
                    width={100}
                    alt="Cloud Heart"
                  />
                </Card.Section>
                <Text size="xxl" fw={1000} ta="center" c="black" style={{ paddingTop: '25px' }}>
                 🪙 1500 Tokens 🪙
                 <Text>Unlock the mysteries of your subconscious with our exclusive monthly subscription. Receive 30 personalized dream 
                  queries each month to delve deeper into your dreams, uncover hidden meanings, and gain profound insights into your inner world. 
                  Don't miss the chance to transform your nightly visions into a journey 
                  of self-discovery—subscribe today and elevate your dream exploration!</Text>
                </Text>

                <Button
                  color="blue"
                  fullWidth
                  mt="md"
                  radius="md"
                  onClick={() => window.location.href = 'https://buy.stripe.com/test_fZedTValBcA72uA9AA'}
                >
                  Activate Subscription
                </Button>
              </Card>
            )}
            <Button 
              color="red" 
              fullWidth
              onClick={handleManageSubscription}
              styles={(theme) => ({
                root: {
                  '&:hover': {
                    backgroundColor: theme.colors.red[7],
                  },
                },
              })}
            >
              Cancel Subscription
            </Button>
          </Stack>
        </Modal>

        <Modal
          opened={isTopUpModalOpen}
          onClose={() => {
            setIsTopUpModalOpen(false);
            setSelectedAmount(null);
          }}
          title="Top Up Tokens"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="topup-options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
            {isSubscriptionActive ? (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Image
                    component={NextImage}
                    src={cloudheart}
                    height={310}
                    width={100}
                    alt="Cloud Heart"
                  />
                </Card.Section>
                <Text size="xxl" fw={1000} ta="center" c="black" style={{ paddingTop: '25px' }}>
                  TOKENS
                </Text>
                <Stack mt="md">
                  <Button 
                    onClick={() => {
                      setSelectedAmount(1500);
                      setConfirmationModalOpen(true);
                    }}
                    styles={(theme) => ({
                      root: {
                        backgroundColor: theme.colors.blue[6],
                        '&:hover': { backgroundColor: theme.colors.blue[7] },
                      },
                    })}
                  >
                    1500 Tokens
                  </Button>
                  <Button 
                    onClick={() => {
                      setSelectedAmount(1000);
                      setConfirmationModalOpen(true);
                    }}
                    styles={(theme) => ({
                      root: {
                        backgroundColor: theme.colors.blue[6],
                        '&:hover': { backgroundColor: theme.colors.blue[7] },
                      },
                    })}
                  >
                    1000 Tokens
                  </Button>
                  <Button 
                    onClick={() => {
                      setSelectedAmount(500);
                      setConfirmationModalOpen(true);
                    }}
                    styles={(theme) => ({
                      root: {
                        backgroundColor: theme.colors.blue[6],
                        '&:hover': { backgroundColor: theme.colors.blue[7] },
                      },
                    })}
                  >
                    500 Tokens
                  </Button>
                </Stack>
              </Card>
            ) : (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text size="xl" fw={700} ta="center">
                  Subscribe to purchase tokens
                </Text>
              </Card>
            )}
            </motion.div>
          </AnimatePresence>
        </Modal>

        <Modal
          opened={confirmationModalOpen}
          onClose={() => setConfirmationModalOpen(false)}
          title="Confirm Purchase"
        >
          <Text size="lg" mb="md">
            Are you sure you want to purchase {selectedAmount} tokens?
          </Text>
          <Group>
            <Button
              onClick={() => {
                // Here you would typically redirect to Stripe or process the payment
                console.log(`Processing payment for ${selectedAmount} tokens`);
                setConfirmationModalOpen(false);
                setIsTopUpModalOpen(false);
                // Add your Stripe redirect logic here
              }}
              color="green"
            >
              Yes, Purchase
            </Button>
            <Button
              onClick={() => setConfirmationModalOpen(false)}
              color="gray"
            >
              No, Cancel
            </Button>
          </Group>
        </Modal>
      </AppShell>
    </MantineProvider>
  );
};

export default Chat;