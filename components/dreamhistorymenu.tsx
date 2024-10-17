import React, { useState } from 'react';
import { Paper, Text, ScrollArea, Button, useMantineTheme, Box, Drawer } from '@mantine/core';
import { IconMenu2 } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';

interface DreamHistoryItem {
  id: string;
  title: string;
  timestamp: string;
}

const DreamHistoryMenu: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const dreamHistory: DreamHistoryItem[] = [
    { id: '1', title: 'Flying over mountains', timestamp: '2023-06-01' },
    { id: '2', title: 'Underwater city with mermaids and talking fish', timestamp: '2023-06-03' },
  ];

  const truncateTitle = (title: string) => {
    const words = title.split(' ');
    if (words.length > 4) {
      return words.slice(0, 4).join(' ') + '...';
    }
    return title;
  };

  const MenuContent = () => (
    <Box p="md">
      <Text size="xl" fw={700} style={{ marginBottom: '15px', color: 'black' }}>
        Dream History
      </Text>
      <ScrollArea style={{ height: isMobile ? 'calc(100vh - 120px)' : 'calc(100% - 60px)' }} type='never'>
        {dreamHistory.map((dream) => (
          <Button
            key={dream.id}
            variant="subtle"
            fullWidth
            styles={(theme) => ({
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
            })}
            onClick={() => {}}
          >
            {truncateTitle(dream.title)}
          </Button>
        ))}
      </ScrollArea>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="subtle"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'absolute',
            top: 10,
            left: 5,
          }}
        >
        <IconMenu2 size={24}  />
        </Button>
        <Drawer
          opened={isOpen}
          onClose={() => setIsOpen(false)}
          title="Dream History"
          padding="md"
          size="100%"
          position="left"
        >
          <MenuContent />
        </Drawer>
      </>
    );
  }

  return (
    <Paper
      style={{
        position: 'fixed',
        left: 0,
        top: 60,
        bottom: 0,
        width: isExpanded ? '250px' : '40px',
        transition: 'width 0.3s ease',
        backgroundColor: 'rgba(179, 229, 252, 0.8)',
        borderRight: '1px solid #9fa8da',
        overflow: 'hidden',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {isExpanded ? (
        <MenuContent />
      ) : (
        <Button
          variant="subtle"
          style={{
            padding: '10px',
            backgroundColor: 'transparent',
            marginTop: 'auto',
          }}
        >
          <IconMenu2 size={24} />
        </Button>
      )}
    </Paper>
  );
};

export default DreamHistoryMenu;