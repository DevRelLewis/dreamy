'use client'

import React, { useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  LoadingOverlay,
  Alert
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

interface ContactModalProps {
  opened: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ opened, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const resetForm = () => {
    setSubject('');
    setMessage('');
    setStatus('idle');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      setStatus('success');
      
      // Close modal after success message
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text size="xl" fw={700} c="#2c2c2c">
          Contact Us
        </Text>
      }
      styles={{
        content: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
        body: {
          padding: '20px',
        },
        header: {
          backgroundColor: 'rgba(179, 229, 252, 0.8)',
          borderBottom: '1px solid #9fa8da',
          marginBottom: '1rem',
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <LoadingOverlay 
            visible={isSubmitting} 
            overlayProps={{ blur: 2 }}
            loaderProps={{ color: '#8da0cb' }}
          />
          
          {status === 'success' && (
            <Alert 
              color="teal" 
              title="Success!" 
              icon={<IconCheck size="1.1rem" />}
            >
              Your message has been sent successfully.
            </Alert>
          )}

          {status === 'error' && (
            <Alert 
              color="red" 
              title="Error" 
              icon={<IconAlertCircle size="1.1rem" />}
            >
              Failed to send message. Please try again.
            </Alert>
          )}
          <TextInput
            required
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject"
            styles={{
              input: {
                backgroundColor: 'rgba(179, 229, 252, 0.3)',
                border: '1px solid #9fa8da',
                '&:focus': {
                  borderColor: '#7986cb',
                },
              },
              label: {
                color: '#2c2c2c',
                marginBottom: '4px',
                fontWeight: 500,
              },
            }}
          />

          <Textarea
            required
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here"
            minRows={4}
            styles={{
              input: {
                backgroundColor: 'rgba(179, 229, 252, 0.3)',
                border: '1px solid #9fa8da',
                '&:focus': {
                  borderColor: '#7986cb',
                },
              },
              label: {
                color: '#2c2c2c',
                marginBottom: '4px',
                fontWeight: 500,
              },
            }}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              onClick={handleClose}
              styles={{
                root: {
                  backgroundColor: 'rgba(179, 229, 252, 0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(179, 229, 252, 0.6)',
                  },
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              styles={{
                root: {
                  backgroundColor: '#8da0cb',
                  '&:hover': {
                    backgroundColor: '#7a8bbd',
                  },
                },
              }}
            >
              Send Message
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default ContactModal;