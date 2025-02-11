import { Trans } from "@lingui/react/macro";
import {
  Divider,
  Group,
  LoadingOverlay,
  Stack,
  Text,
  Title,
  Button,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useParams } from "react-router-dom";
import {
  useConversationById,
  useConversationChunks,
  useProjectById,
} from "@/lib/query";
import { InformationTooltip } from "@/components/common/InformationTooltip";
import { ConversationEdit } from "@/components/conversation/ConversationEdit";
import { ConversationDangerZone } from "@/components/conversation/ConversationDangerZone";
import { finishConversation } from "@/lib/api";
import { IconRefresh } from "@tabler/icons-react";
import { t } from "@lingui/core/macro";

export const ProjectConversationOverviewRoute = () => {
  const { conversationId, projectId } = useParams();
  const conversationQuery = useConversationById({
    conversationId: conversationId ?? "",
  });
  const conversationChunksQuery = useConversationChunks(conversationId ?? "");
  const projectQuery = useProjectById({ projectId: projectId ?? "" });

  const handleGenerateSummaryManually = async () => {
    await finishConversation(conversationId ?? "");
  };

  return (
    <Stack gap="3rem" className="relative" px="2rem" pt="2rem" pb="2rem">
      <LoadingOverlay visible={conversationQuery.isLoading} />
      {conversationChunksQuery.data &&
        conversationChunksQuery.data?.length > 0 && (
          <Stack gap="1.5rem">
            <>
              <Group>
                <Title order={2}>
                  <Trans>Summary</Trans>
                </Title>
                {/* <InformationTooltip
                  label={
                    <Text>
                      <Trans>
                        This summary is AI-generated and brief, for thorough
                        analysis, use the Chat or Library.
                      </Trans>
                    </Text>
                  }
                /> */}
                <Tooltip
                  label={
                    conversationQuery.data?.summary
                      ? t`Regenerate Summary`
                      : t`Generate Summary`
                  }
                >
                  <ActionIcon
                    variant="transparent"
                    color="black"
                    onClick={handleGenerateSummaryManually}
                  >
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Text>
                {conversationQuery.data?.summary ??
                  t`Summary not available yet`}
              </Text>

              <Divider />
            </>
          </Stack>
        )}

      {conversationQuery.data && projectQuery.data && (
        <>
          <Stack gap="1.5rem">
            <ConversationEdit
              key={conversationQuery.data.id}
              conversation={conversationQuery.data}
              projectTags={projectQuery.data.tags}
            />
          </Stack>

          <Divider />

          <Stack gap="1.5rem">
            <ConversationDangerZone conversation={conversationQuery.data} />
          </Stack>
        </>
      )}
    </Stack>
  );
};
