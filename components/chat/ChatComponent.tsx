"use client";

import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import DisclaimerModal from "../../components/disclaimer/dislaimer";
import { useRouter } from "next/navigation";
import {
  Container,
  TextInput,
  Box,
  Textarea,
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
  createTheme,
  Menu,
  Stack,
  Modal,
  Card,
  Image,
  Center,
  AppShellNavbar,
  Burger,
  Flex,
} from "@mantine/core";
import { IconSend, IconMessageCircle, IconMenu2 } from "@tabler/icons-react";
import { supabase } from "../../supabase/supabaseClient";
import { Notifications, notifications } from "@mantine/notifications";
import dreamsanlogo from "../../app/public/dream-san-logo.png";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lobster } from "next/font/google";
import { useMediaQuery, useDisclosure } from "@mantine/hooks";
import { processTokenTransaction } from "../../components/token system/TokenSystem";
import {
  hasEnoughTokens,
  estimateTokenCost,
} from "../../components/utils/tokenUtils/TokenUtility";
import classes from "./page.module.css";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import ContactModal from '../../components/contactModal/contactModal';
const lobster = Lobster({ weight: "400", subsets: ["latin"] });

type KindeUser = {
  id: string;
  email: string | null;
  given_name: string | null;
  family_name: string | null;
  picture?: string | null;
  // Include other properties if necessary
};


type Message = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    id: string;
    email: string;
  };
  imageUrl?: string;
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
  image_url: string;
};


const theme = createTheme({
  primaryColor: "blue",
  fontFamily: "Segoe UI, sans-serif",
  white: "#ffffff",
  black: "#202124",
  components: {
    Button: {
      styles: (theme: any) => ({
        root: {
          borderRadius: theme.radius.md,
          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
          backgroundColor: "#8da0cb",
          color: theme.white,
          transition: "background-color 0.3s ease, box-shadow 0.3s ease",

          "&:hover": {
            backgroundColor: "#7a8bbd",
            boxShadow: theme.shadows.md,
          },

          "&:disabled": {
            backgroundColor: "#a1b1d6",
            color: "#e0e0e0",
          },
        },
      }),
    },
    TextInput: {
      styles: (theme: any) => ({
        root: { flex: 2 },
        input: {
          borderRadius: theme.radius.md,
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          color: theme.black,
          "&::placeholder": {
            color: "rgba(0, 0, 0, 0.5)",
          },
          "&:focus": {
            borderColor: theme.colors.blue[6],
          },
        },
      }),
    },
  },
});

const checkOrCreateUser = async (kindeUser: any) => {
  try {
    if (!kindeUser?.email) {
      console.error('Kinde user email is missing');
      return null;
    }

    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', kindeUser.email.toLowerCase())
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', searchError);
      return null;
    }

    if (existingUser) {
      // Update the existing user's Kinde ID if it's missing
      if (!existingUser.kinde_user_id) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ kinde_user_id: kindeUser.id })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('Error updating Kinde ID:', updateError);
        }
      }
      return existingUser;
    }

    // Create new user if none exists
    const newUser = {
      first_name: kindeUser.given_name || '',
      last_name: kindeUser.family_name || '',
      email: kindeUser.email.toLowerCase(),
      token_balance: 250,
      tokens_spent: 0,
      is_subscribed: false,
      kinde_user_id: kindeUser.id,
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return null;
    }

    return insertedUser;
  } catch (err) {
    console.error('Exception in checkOrCreateUser:', err);
    return null;
  }
};

const Chat: React.FC = (serverUser: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] =
    useState<boolean>(true);
  const [isToppedUp, setIsToppedUp] = useState<boolean>(false);
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState<number | null>(
    null
  );
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);
  const [opened, { toggle }] = useDisclosure();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dreamHistory, setDreamHistory] = useState<DreamSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const isTablet = useMediaQuery("(max-width: 1024px) and (max-height: 790px)");
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(true);
  const [contactModalOpened, setContactModalOpened] = useState(false);
  const { user, isAuthenticated } = useKindeBrowserClient()


  const truncateTitle = (title: string) => {
    const words = title.split(" ");
    return words.length > 4 ? words.slice(0, 6).join(" ") + "..." : title;
  };

  const handleManageSubscription = () => {
    setIsLoading(true);
    try {
      // Redirect to the Stripe billing portal
      window.location.href =
        "https://billing.stripe.com/p/login/test_4gw29Sez273BcyQcMM";
    } catch (error) {
      console.error("Error redirecting to subscription management:", error);
      notifications.show({
        title: "Error",
        message:
          "Failed to open subscription management page. Please try again.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserAndData = async (): Promise<void> => {
      setLoading(true);
      console.log('USER:', user);
    
      try {
        if (isAuthenticated && user) {
          // Kinde user is authenticated
          const authUser = user as KindeUser;
    
          // Check if user exists in the users table or create a new entry
          const userData = await checkOrCreateUser(authUser);
          if (userData && userData.id) {
            setUserData(userData);
            setCurrentUserId(userData.id);
            console.log('Current User ID:', userData.id);
    
            // Set the subscription status based on the is_subscribed field
            setIsSubscriptionActive(userData.is_subscribed);
    
            // Fetch dream history from Supabase using Supabase user ID
            const { data: dreamHistoryData, error: dreamHistoryError } =
              await supabase
                .from('dream_sessions')
                .select('id, dream_text, created_at, image_url')
                .eq('user_id', userData.id)
                .order('created_at', { ascending: false });
    
            if (dreamHistoryError) {
              throw dreamHistoryError;
            }
    
            setDreamHistory(dreamHistoryData || []);
          } else {
            console.error('User data not found or userData.id is undefined.');
            notifications.show({
              title: 'Error',
              message: 'Failed to load user data.',
              color: 'red',
            });
          }
    
          // Reset session and messages
          setActiveSessionId(null);
          setMessages([]);
        } else {
          // User is not authenticated
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
          message: `Failed to load user data and dream history: ${error instanceof Error ? error.message : 'Unknown error'}`,
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserAndData();
  }, [isAuthenticated, user, messages]);
  

  const handleLogout = () => {
 
  }

  const handleDisclaimerClose = () => {
    setIsDisclaimerOpen(false);
    localStorage.setItem("hasSeenDisclaimer", "true");
  };

  const loadDreamSession = async (sessionId: string): Promise<void> => {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("dream_sessions")
        .select("messages, image_url")
        .eq("id", sessionId)
        .single();
  
      if (sessionError) {
        throw sessionError;
      }
  
      if (sessionData && sessionData.messages) {
        const formattedMessages: Message[] = sessionData.messages;
  
        // Ensure the image URL is set for the first assistant message
        const firstAssistantMessageIndex = formattedMessages.findIndex(
          (msg) => msg.user_id === "assistant"
        );
        if (firstAssistantMessageIndex !== -1) {
          formattedMessages[firstAssistantMessageIndex].imageUrl =
            sessionData.image_url;
        }
  
        setMessages(formattedMessages);
        setActiveSessionId(sessionId);
      }
    } catch (error) {
      console.error("Error loading dream session:", error);
      notifications.show({
        title: "Error",
        message: `Failed to load dream session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        color: "red",
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (): Promise<void> => {
    if (newMessage.trim() === "") return;
    setSending(true);
  
    if (!currentUserId || !userData) {
      notifications.show({
        title: "Unauthorized",
        message: "You must be signed in to send messages.",
        color: "red",
      });
      setSending(false);
      return;
    }
  
    try {
      // Process token transaction
      const transactionSuccess = await processTokenTransaction(
        currentUserId,
        newMessage
      );
      if (!transactionSuccess) {
        throw new Error("Insufficient tokens");
      }
  
      let imageUrl: string | undefined;
  
      // Generate and save DALL-E image only if it's a new session
      if (!activeSessionId) {
        const imageResponse = await fetch("/api/dalle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: newMessage, userId: currentUserId }),
        });
  
        if (imageResponse.ok) {
          const imageData: { imageUrl: string } = await imageResponse.json();
          imageUrl = imageData.imageUrl;
        }
      }
  
      // Send message to API
      const response = await fetch("/api/dreamy", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          prompt: newMessage,
          userId: currentUserId,
          sessionId: activeSessionId,
          imageUrl: imageUrl,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to get assistant response: ${errorData}`);
      }
  
      const data: { reply: string; sessionId: string } = await response.json();
  
      // Create message objects
      const userMessage: Message = {
        id: Date.now().toString(),
        content: newMessage,
        user_id: currentUserId,
        created_at: new Date().toISOString(),
        user: { id: currentUserId, email: userData.email },
      };
  
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply,
        user_id: "assistant",
        created_at: new Date().toISOString(),
        user: { id: "assistant", email: "assistant@example.com" },
        imageUrl: imageUrl,
      };
  
      // First, get the current messages array
      const { data: currentSessionData, error: fetchError } = await supabase
        .from("dream_sessions")
        .select("messages")
        .eq("id", data.sessionId)
        .single();
  
      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }
  
      // Prepare the new messages array
      const updatedMessages: Message[] = currentSessionData?.messages || [];
      updatedMessages.push(userMessage, assistantMessage);
  
      // Update session in Supabase
      const { error: sessionError } = await supabase
        .from("dream_sessions")
        .upsert(
          {
            id: data.sessionId,
            user_id: currentUserId,
            messages: updatedMessages,
            image_url: imageUrl,
            dream_text: newMessage
          },
          { onConflict: "id" }
        );
  
      if (sessionError) {
        throw sessionError;
      }
  
      // Update UI state
      setMessages(updatedMessages);
      setActiveSessionId(data.sessionId);
  
      // Update user's token balance in the UI
      const tokenCost = estimateTokenCost(newMessage);
      setUserData((prevData) => prevData ? {
        ...prevData,
        token_balance: prevData.token_balance - tokenCost,
      } : null);
  
      // Clear input and update state
      setNewMessage("");
      scrollToBottom();
  
    } catch (error) {
      console.error("Error sending message:", error);
      notifications.show({
        title: "Error",
        message: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        color: "red",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <AppShell
        padding="md"
        header={{ height: 60 }}
        navbar={{
          width: 250,
          breakpoint: "sm",
          collapsed: { desktop: !desktopOpened, mobile: !mobileOpened },
        }}
        styles={(theme) => ({
          header: {
            backgroundColor: "rgba(179, 229, 252, 0.8)",
            borderBottom: "1px solid #9fa8da",
          },
          main: {
            background:
              "linear-gradient(135deg, #e0f7fa 0%, #b3e5fc 25%, #9fa8da 50%, #b39ddb 75%, #d1c4e9 100%)",
          },
        })}
      >
        <AppShell.Header>
          <Container size="xxl" h="100%" w="100%">
            <Group justify="space-between" h="100%" w="100%">
              <Group>
                <Burger
                  opened={mobileOpened}
                  onClick={toggleMobile}
                  hiddenFrom="sm"
                  size="sm"
                />
                <Burger
                  opened={desktopOpened}
                  onClick={toggleDesktop}
                  visibleFrom="md"
                  size="sm"
                />
                <Stack gap="0px" align="flex-start" justify="center" h="100%">
                  <Text
                    className={lobster.className}
                    size="xl"
                    fw={700}
                    style={{
                      background:
                        "linear-gradient(315deg, #b3e5fc 0%, #9fa8da 50%, #b39ddb 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "transparent",
                      display: "inline-block",
                      marginLeft: isMobile ? "60px" : "0",
                    }}
                  >
                    Dream-San
                  </Text>
                  <Text
                    size="sm"
                    hiddenFrom="sm"
                    style={{
                      marginLeft: "60px",
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  >
                    Token Balance: {userData?.token_balance}
                  </Text>
                </Stack>
              </Group>
              <Group>
                <Box
                  hiddenFrom="sm"
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <Menu>
                    <Menu.Target>
                      <Avatar
                        color="white"
                        radius="xl"
                        style={{
                          transition: "all 0.2s ease-in-out",
                          cursor: "pointer",
                          border: "2.5px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        <Text size="25px">
                          {userData?.first_name
                            ? userData.first_name[0].toUpperCase()
                            : "U"}
                        </Text>
                      </Avatar>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>
                        <Text size="xl">
                          User: {userData?.first_name} {userData?.last_name}
                        </Text>
                      </Menu.Label>
                      <Menu.Label>
                        <Flex direction="row" align="center" gap="10px">
                          <Text size="xl">Subscribed: </Text>
                          <Text
                            size="xl"
                            span
                            c={userData?.is_subscribed ? "green" : "red"}
                            fw={600}
                          >
                            {userData?.is_subscribed ? "Yes" : "No"}
                          </Text>
                        </Flex>
                      </Menu.Label>
                      <Menu.Item
                        onClick={() => setIsSubscriptionModalOpen(true)}
                      >
                        <Text size="xl">Manage Subscription</Text>
                      </Menu.Item>
                      <Menu.Item>
                        <Stack align="center">
                          <Container
                            onClick={() => setIsTopUpModalOpen(true)}
                            style={{
                              backgroundColor: "rgba(179, 229, 252, 0.8)",
                              borderRadius: "8px",
                              padding: "10px 20px",
                              cursor: "pointer",
                              transition: "background-color 0.3s ease",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              width: "100%",
                            }}
                            styles={(theme) => ({
                              root: {
                                "&:hover": {
                                  backgroundColor: theme.colors.blue[1],
                                },
                                "&:active": {
                                  backgroundColor: theme.colors.blue[2],
                                },
                              },
                            })}
                          >
                            <Text
                              size="25px"
                              fw={500}
                              span
                              style={{ color: "#2c2c2c" }}
                            >
                              Top Up
                            </Text>
                          </Container>
                        </Stack>
                      </Menu.Item>
                      <Menu.Item>
                        <Container
                          onClick={handleLogout}
                          size="lg"
                          style={{
                            backgroundColor: "red",
                            borderRadius: "8px",
                            padding: "10px 20px",
                            cursor: "pointer",
                            transition: "background-color 0.3s ease",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                          }}
                          styles={(theme) => ({
                            root: {
                              "&:hover": {
                                backgroundColor: theme.colors.blue[1],
                              },
                              "&:active": {
                                backgroundColor: theme.colors.blue[2],
                              },
                            },
                          })}
                        >
                          <Text
                            size="25px"
                            fw={500}
                            span
                            style={{ color: "black" }}
                          >
                            Logout
                          </Text>
                        </Container>
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Box>
                <Group visibleFrom="sm">
                  <Text size="xl" mr="md">
                    Token Balance: {userData?.token_balance}
                  </Text>
                  <Menu>
                    <Menu.Target>
                      <div
                        style={{
                          display: "inline-block",
                          borderRadius: "60%",
                          overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                          const avatar = e.currentTarget
                            .firstElementChild as HTMLElement;
                          if (avatar) {
                            avatar.style.boxShadow = `
                      0 0 20px 10px rgba(255, 255, 255, 0.8),
                      0 0 40px 20px rgba(255, 255, 255, 0.6),
                      0 0 60px 30px rgba(255, 255, 255, 0.4),
                      0 0 80px 40px rgba(255, 255, 255, 0.2),
                      0 0 100px 50px rgba(255, 255, 255, 0.1)
                    `;
                            avatar.style.border =
                              "2px solid rgba(255, 255, 255, 1)";
                            avatar.style.fontWeight = "700";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const avatar = e.currentTarget
                            .firstElementChild as HTMLElement;
                          if (avatar) {
                            avatar.style.boxShadow = "none";
                            avatar.style.border =
                              "2.5px solid rgba(255, 255, 255, 0.2)";
                            avatar.style.fontWeight = "400";
                          }
                        }}
                      >
                        <Avatar
                          color="white"
                          radius="xl"
                          style={{
                            transition: "all 0.2s ease-in-out",
                            cursor: "pointer",
                          }}
                        >
                          <Text size="25px">
                            {userData?.first_name
                              ? userData.first_name[0].toUpperCase()
                              : "U"}
                          </Text>
                        </Avatar>
                      </div>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>
                        <Text size="xl">
                          User: {userData?.first_name} {userData?.last_name}
                        </Text>
                      </Menu.Label>
                      <Menu.Label>
                        <Flex direction="row" align="center" gap="10px">
                          <Text size="xl">Subscribed: </Text>
                          <Text
                            size="xl"
                            span
                            c={userData?.is_subscribed ? "green" : "red"}
                            fw={600}
                          >
                            {userData?.is_subscribed ? "Yes" : "No"}
                          </Text>
                        </Flex>
                      </Menu.Label>
                      <Menu.Item
                        onClick={() => setIsSubscriptionModalOpen(true)}
                      >
                        <Text size="xl">Manage Subscription</Text>
                      </Menu.Item>
                      <Menu.Item>
                        <Stack align="center">
                          <Container
                            onClick={() => setIsTopUpModalOpen(true)}
                            style={{
                              backgroundColor: "rgba(179, 229, 252, 0.8)",
                              borderRadius: "8px",
                              padding: "10px 20px",
                              cursor: "pointer",
                              transition: "background-color 0.3s ease",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              width: "100%",
                            }}
                            styles={(theme) => ({
                              root: {
                                "&:hover": {
                                  backgroundColor: theme.colors.blue[1],
                                },
                                "&:active": {
                                  backgroundColor: theme.colors.blue[2],
                                },
                              },
                            })}
                          >
                            <Text
                              size="25px"
                              fw={500}
                              span
                              style={{ color: "#2c2c2c" }}
                            >
                              Top Up
                            </Text>
                          </Container>
                        </Stack>
                      </Menu.Item>
                      <Menu.Item>
                        <Container
                          onClick={handleLogout}
                          size="lg"
                          style={{
                            backgroundColor: "red",
                            borderRadius: "8px",
                            padding: "10px 20px",
                            cursor: "pointer",
                            transition: "background-color 0.3s ease",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                          }}
                          styles={(theme) => ({
                            root: {
                              "&:hover": {
                                backgroundColor: theme.colors.blue[1],
                              },
                              "&:active": {
                                backgroundColor: theme.colors.blue[2],
                              },
                            },
                          })}
                        >
                          <Text
                            size="25px"
                            fw={500}
                            span
                            style={{ color: "black" }}
                          >
                            Logout
                          </Text>
                        </Container>
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Group>
            </Group>
          </Container>
        </AppShell.Header>

        <AppShell.Navbar
          p="md"
          style={{
            backgroundColor: "rgba(179, 229, 252, 0.8)",
            borderRight: "1px solid #9FA8DA",
            transition: "width 0.3s ease",
            display: "flex",
            flexDirection: "column",
          }}
        >
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
          <ScrollArea style={{ flex: 1 }} type="auto">
            <Stack gap="5px">
              {dreamHistory.map((dream) => (
                <Button
                  key={dream.id}
                  variant="subtle"
                  fullWidth
                  styles={{
                    root: {
                      justifyContent: "flex-start",
                      padding: "10px",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      height: "auto",
                      minHeight: 36,
                      transition: "background-color 0.2s ease",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                      },
                    },
                    label: {
                      color: "black",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%",
                      textAlign: "left",
                    },
                  }}
                  onClick={() => {
                    loadDreamSession(dream.id);
                  }}
                >
                  <Stack gap="5px">
                    <Text size="xs" fw={700}>
                      {new Date(dream.created_at).toLocaleDateString()}
                    </Text>
                    <Text size="md">{truncateTitle(dream.dream_text)}</Text>
                  </Stack>
                </Button>
              ))}
            </Stack>
          </ScrollArea>
        </AppShell.Navbar>

        <AppShell.Main>
          <Container size="md" py="xl">
            <DisclaimerModal
              opened={isDisclaimerOpen}
              onClose={handleDisclaimerClose}
            />
            <Paper
              shadow="lg"
              radius="md"
              p="md"
              className="custom-scrollbar"
              style={{
                height: "max(80vh, calc(100vh - 160px))",
                display: "flex",
                flexDirection: "column",
                overflow: "visible",
                padding: "1rem",
                boxSizing: "border-box",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              }}
            >
              <ScrollArea
                type="always"
                offsetScrollbars
                classNames={classes}
                style={{
                  flex: 1,
                  marginBottom: "1rem",
                  backgroundColor: "transparent",
                }}
              >
                {loading ? (
                  <Group justify="center" mt="xl">
                    <Loader color="black" />
                  </Group>
                ) : (
                  messages.map((msg) => (
                    <Group
                      key={msg.id}
                      justify={
                        msg.user_id === currentUserId
                          ? "flex-end"
                          : "flex-start"
                      }
                      gap="xs"
                      mb="xs"
                    >
                      {msg.user_id !== currentUserId && msg.imageUrl && (
                        <Flex
                          justify="center"
                          align="center"
                          style={{ width: "100%", minHeight: 220, gap: "sm" }}
                        >
                          <Image
                            src={msg.imageUrl}
                            alt="Dream visualization"
                            radius="md"
                            width={200}
                            height={200}
                            fit="contain"
                          />
                        </Flex>
                      )}
                      <Paper
                        radius="md"
                        p="xs"
                        bg={
                          msg.user_id === currentUserId
                            ? "rgba(255, 255, 255, 0.5)"
                            : "rgba(179, 229, 252, 0.8)"
                        }
                      >
                        {msg.user_id === currentUserId ? (
                          <Text size="sm">{msg.content}</Text>
                        ) : (
                          <Markdown>{msg.content}</Markdown>
                        )}
                      </Paper>
                    </Group>
                  ))
                )}
                <div ref={scrollRef} />
              </ScrollArea>
              <Group
                align="flex-end"
                w="100%"
                style={{ flexDirection: isMobile ? "column" : "row" }}
              >
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.currentTarget.value)}
                  size="12px"
                  autosize
                  minRows={1}
                  maxRows={7}
                  style={{ width: isMobile ? "100%" : "85%" }}
                  disabled={sending}
                  styles={{
                    input: {
                      borderRadius: "10px",
                      padding: "0.75rem",
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      border: "none",
                      height: "42.5px",
                      overflow: "hidden",
                      overflowY: "auto",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    },
                  }}
                />
                <Button
                  loaderProps={{ size: 35 }}
                  color="#999999"
                  onClick={handleSendMessage}
                  loading={sending}
                  disabled={sending}
                  size="42px"
                  style={{
                    width: isMobile ? "100%" : "auto",
                    flex: isMobile ? "none" : 1.1,
                  }}
                >
                  {isMobile || isTablet ? (
                    <Text size="20px">☁️</Text>
                  ) : (
                    <Text size="20px">☁️ Send</Text>
                  )}
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
          <ContactModal 
          opened={contactModalOpened}
          onClose={() => setContactModalOpened(false)}
          />
          <Stack>
            {isSubscriptionActive ? (
              <Flex direction="row" align="center" gap="10px">
                <Text size="xl">Subscribed: </Text>
                <Text
                  size="xl"
                  span
                  c={userData?.is_subscribed ? "green" : "red"}
                  fw={600}
                >
                  {userData?.is_subscribed ? "Yes" : "No"}
                </Text>
              </Flex>
            ) : (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Image
                    component={NextImage}
                    src={dreamsanlogo}
                    height={310}
                    width={100}
                    alt="Cloud Heart"
                  />
                </Card.Section>
                <Stack>
                  <Text
                    size="xxl"
                    fw={1000}
                    ta="center"
                    c="black"
                    style={{ paddingTop: "25px" }}
                  >
                    🪙 1500 Tokens 🪙
                  </Text>
                  <Text
                    size="xxl"
                    fw={1000}
                    ta="center"
                    c="black"
                    style={{ paddingTop: "25px" }}
                  >
                    Unlock the mysteries of your subconscious with our exclusive
                    monthly subscription. Receive 30 personalized dream queries
                    each month to delve deeper into your dreams, uncover hidden
                    meanings, and gain profound insights into your inner world.
                    Don't miss the chance to transform your nightly visions into
                    a journey of self-discovery—subscribe today and elevate your
                    dream exploration!
                  </Text>
                </Stack>

                <Button
                  color="blue"
                  fullWidth
                  mt="md"
                  radius="md"
                  onClick={() =>
                    (window.location.href =
                      "https://buy.stripe.com/test_fZedTValBcA72uA9AA")
                  }
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
                  "&:hover": {
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
                      src={dreamsanlogo}
                      height={100}
                      width={100}
                      alt="Cloud Heart"
                    />
                  </Card.Section>
                  <Text
                    size="xxl"
                    fw={1000}
                    ta="center"
                    c="black"
                    style={{ paddingTop: "25px" }}
                  >
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
                          "&:hover": { backgroundColor: theme.colors.blue[7] },
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
                          "&:hover": { backgroundColor: theme.colors.blue[7] },
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
                          "&:hover": { backgroundColor: theme.colors.blue[7] },
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
                let stripeUrl = "";

                // Check the selectedTokenAmount and assign the corresponding Stripe link
                if (selectedAmount === 500) {
                  stripeUrl = "https://buy.stripe.com/aEU29n2NPclfbYI6op";
                } else if (selectedAmount === 1000) {
                  stripeUrl = "https://buy.stripe.com/aEU7tH2NP9930g05km";
                } else if (selectedAmount === 1500) {
                  stripeUrl = "https://buy.stripe.com/dR601f3RT5WR8MwdQT";
                }

                if (stripeUrl) {
                  console.log(
                    `Processing payment for ${selectedAmount} tokens`
                  );
                  setConfirmationModalOpen(false);
                  setIsTopUpModalOpen(false);

                  // Redirect to the Stripe payment link
                  window.location.href = stripeUrl;
                } else {
                  console.error("Invalid token amount selected");
                }
              }}
              color="green"
            >
              Pay for Tokens
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
