import { t } from "@lingui/core/macro";
import { IconRefresh, IconUsersGroup } from "@tabler/icons-react";
import { directus } from "@/lib/directus";
import { useQuery } from "@tanstack/react-query";
import { readItems } from "@directus/sdk";
import { ActionIcon, Group, Stack, Text } from "@mantine/core";
import { SummaryCard } from "../common/SummaryCard";

const TIME_INTERVAL = 5 * 60 * 1000; // 5 min

export const OngoingConversationsSummaryCard = ({
  projectId,
}: {
  projectId: string;
}) => {
  const conversationChunksQuery = useQuery({
    queryKey: ["conversation_chunks", projectId],
    queryFn: async () => {
      const chunks = await directus.request(
        readItems("conversation_chunk", {
          filter: {
            conversation_id: {
              project_id: projectId,
            },
            timestamp: {
              // @ts-expect-error gt is not typed
              _gt: new Date(Date.now() - TIME_INTERVAL).toISOString(),
            },
          },
          fields: ["conversation_id"],
        }),
      );

      const uniqueConversations = new Set(
        chunks.map((chunk) => chunk.conversation_id),
      );

      return uniqueConversations.size;
    },
    refetchInterval: 15000, // Update every 10 seconds
  });

  return (
    <SummaryCard
      icon={<IconUsersGroup size={24} />}
      label={
        <Group
          gap="xs"
          p={0}
          justify="space-between"
          w="100%"
          className="relative"
        >
          <Text className="text-lg">{t`Ongoing Conversations`}</Text>
          <ActionIcon
            variant="transparent"
            c="gray.8"
            opacity={0.6}
            disabled={conversationChunksQuery.isFetching}
            onClick={() => {
              conversationChunksQuery.refetch();
            }}
          >
            <IconRefresh />
          </ActionIcon>
        </Group>
      }
      value={
        <Stack className="h-full" gap="xs">
          <Text size="2rem" fw={600}>
            {conversationChunksQuery.data ?? 0}
          </Text>
        </Stack>
      }
      loading={conversationChunksQuery.isFetching}
    />
  );
};
