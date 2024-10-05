'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  

  const dreamHistory = [
    { id: '1', title: 'Flying over mountains', timestamp: '2023-06-01' },
    { id: '2', title: 'Underwater city with mermaids and talking fish', timestamp: '2023-06-03' },
  ];

  const truncateTitle = (title: string) => {
    const words = title.split(' ');
    return words.length > 4 ? words.slice(0, 4).join(' ') + '...' : title;
  };

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data, error } = await supabase
        .from('messages')
        .select('*, user:profiles(*)')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to load messages.',
          color: 'red',
        });
      } else {
        setMessages(data as Message[]);
      }
      setLoading(false);
      scrollToBottom();
    };

    fetchUserAndMessages();

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    setSending(true);

    if (!currentUserId) {
      notifications.show({
        title: 'Unauthorized',
        message: 'You must be signed in to send messages.',
        color: 'red',
      });
      setSending(false);
      return;
    }

    const { error } = await supabase.from('messages').insert([
      {
        content: newMessage,
        user_id: currentUserId,
      },
    ]);

    if (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to send message.',
        color: 'red',
      });
    } else {
      setNewMessage('');
    }

    setSending(false);
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
                      <Text size='25px'>US</Text>
                    </Avatar>
                  </div>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>
                    <Text size='xl'>User Settings</Text>
                  </Menu.Label>
                  <Menu.Label>
                    <Flex direction='row' align='center'><Text size='xl'>Subscribed:{' '}</Text>
                      <Text size='xl' span c={isSubscriptionActive ? "green" : "red"} fw={600}>
                        {isSubscriptionActive ? 'Yes' : 'No'}
                      </Text>
                    </Flex>
                  </Menu.Label>
                  <Menu.Item onClick={() => setIsSubscriptionModalOpen(true)}>
                   <Text size='xl'>Manage Subscription</Text> 
                  </Menu.Item>
                  <Menu.Item>
                    <Stack align="center">
                      <Text size='xl'>Tokens: 1000000</Text>
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
              onClick={() => {/* Handle dream selection */}}>
              {truncateTitle(dream.title)}
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
                  onClick={() => setIsSubscriptionActive(true)}
                >
                  Activate Subscription
                </Button>
              </Card>
            )}
            <Button 
              color="red" 
              fullWidth
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