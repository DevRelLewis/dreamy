import React from 'react';
import { Card, Text, Group, Stack } from '@mantine/core';

interface StatsCardProps {
  title: string;
  stat: string | number;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, stat }) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group>
        <Stack>
            <Text>{title}</Text>
            <Text size="xl">{stat}</Text>
        </Stack>
      </Group>
    </Card>
  );
};

export default StatsCard;