import React from 'react';
import { Modal, Text, Stack, Button, ScrollArea, Group, Loader, Flex, Image, Paper } from '@mantine/core';
import styles from './disclaimermodal.module.css';

interface DisclaimerModalProps {
  opened: boolean;
  onClose: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ opened, onClose }) => {
  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Dream-San App Disclaimer" 
      size="lg"
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      radius="16px" // Applies a 16px border-radius to the entire modal
      styles={{
        header: {
          backgroundColor: 'rgba(179, 229, 252, 1)', // Opaque background
          padding: '16px 24px', // Optional: Adjust padding as needed
        },
        body: {
          backgroundColor: 'rgba(179, 229, 252, 0.9)', // Semi-transparent body background
          padding: '20px',
        },
      }}
    >
      <div className={styles.content}>
        <ScrollArea
          style={{ height: '400px', marginBottom: '1rem' }} // Adjust height as needed
          styles={(theme) => ({
            root: {
              background: 'transparent', // Transparent outer container
            },
            viewport: {
              background: 'transparent', // Transparent scrollable area
            },
            scrollbar: {
              background: 'transparent', // Transparent scrollbar track
            },
            thumb: {
              backgroundColor: theme.colors.gray[3], // Scrollbar thumb color
              '&:hover': {
                backgroundColor: theme.colors.gray[4], // Darker on hover
              },
            },
            corner: {
              background: 'transparent', // Transparent corner
            },
          })}
        >
          <Stack gap="md">
            <Text>
              Welcome to Dream-San, your AI-powered dream interpretation companion. Before you begin your journey of dream exploration, please read and acknowledge the following disclaimer:
            </Text>
            
            <Text fw={700}>1. Purpose and Limitations:</Text>
            <Text>
              Dream-San is designed for entertainment and self-reflection purposes only. The interpretations provided are generated by artificial intelligence and should not be considered as professional psychological or therapeutic advice.
            </Text>

            <Text fw={700}>2. No Substitute for Professional Help:</Text>
            <Text>
              Our app is not a substitute for professional medical, psychological, or psychiatric treatment. If you are experiencing mental health concerns or recurring distressing dreams, please consult with a qualified healthcare professional.
            </Text>

            <Text fw={700}>3. AI Interpretation:</Text>
            <Text>
              The dream interpretations are generated by AI based on patterns and information it has been trained on. These interpretations may not always be accurate or applicable to your personal situation.
            </Text>

            <Text fw={700}>4. Privacy and Data Use:</Text>
            <Text>
              While we take measures to protect your privacy, please be aware that the dreams you share are processed by our AI system. Do not share sensitive personal information in your dream descriptions.
            </Text>

            <Text fw={700}>5. User Responsibility:</Text>
            <Text>
              Users are responsible for their own actions and decisions based on the app's interpretations. Dream-San and its creators are not liable for any consequences resulting from the use of this app.
            </Text>

            <Text fw={700}>6. Accuracy and Completeness:</Text>
            <Text>
              We strive to provide helpful and insightful interpretations, but we do not guarantee the accuracy, completeness, or usefulness of any interpretation provided by the app.
            </Text>

            <Text fs='italic'>
              By using Dream-San, you acknowledge that you have read, understood, and agree to this disclaimer. If you do not agree with these terms, please do not use the app.
            </Text>
          </Stack>
        </ScrollArea>
        <Button onClick={onClose} fullWidth className={styles.acceptButton}>
          I Understand and Accept
        </Button>
      </div>
    </Modal>
  );
};

export default DisclaimerModal;
