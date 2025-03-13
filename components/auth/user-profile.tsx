'use client'

import React from 'react'
import { Avatar, Menu, Text, Button, Flex, Container, Stack } from '@mantine/core'
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components'
import { useRouter } from 'next/navigation'

interface UserProfileProps {
  userData: {
    id: string
    first_name?: string
    last_name?: string
    email: string
    token_balance: number
    is_subscribed: boolean
    avatar_url?: string
  } | null
  onOpenSubscriptionModal: () => void
  onOpenTopUpModal: () => void
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  userData, 
  onOpenSubscriptionModal, 
  onOpenTopUpModal 
}) => {
  const router = useRouter()

  // Get initial for avatar display
  const getInitial = () => {
    if (!userData) return 'U'
    
    if (userData.first_name) {
      return userData.first_name[0].toUpperCase()
    }
    
    if (userData.email) {
      return userData.email[0].toUpperCase()
    }
    
    return 'U'
  }

  return (
    <Menu>
      <Menu.Target>
      <Avatar
  color="violet"
  radius="xl"
  style={{
    transition: "all 0.2s ease-in-out",
    cursor: "pointer",
    border: "2.5px solid rgba(255, 255, 255, 0.2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }}
>
  <Text 
    size="25px" 
    style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      width: "100%",
      height: "100%",
      margin: 0
    }}
  >
    {getInitial()}
  </Text>
</Avatar>
      </Menu.Target>
      
      <Menu.Dropdown>
        <Menu.Label>
          <Text size="xl">
            User: {userData?.first_name || 'User'} {userData?.last_name || ''}
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
        
        <Menu.Item onClick={onOpenSubscriptionModal}>
          <Text size="xl">Manage Subscription</Text>
        </Menu.Item>
        
        <Menu.Item>
          <Stack align="center">
            <Container
              onClick={onOpenTopUpModal}
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
          <LogoutLink
            className="rounded-md px-4 py-2"
            style={{
              backgroundColor: '#7e57c2',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 16px',
              textDecoration: 'none',
              width: '100%',
              textAlign: 'center',
              display: 'block'
            }}
            postLogoutRedirectURL="/"
          >
            Logout
          </LogoutLink>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

export default UserProfile