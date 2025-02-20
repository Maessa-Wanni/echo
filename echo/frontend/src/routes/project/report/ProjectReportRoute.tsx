import { useParams } from "react-router-dom";
import {
  useDoesProjectReportNeedUpdate,
  useLatestProjectReport,
  useProjectReportViews,
  useUpdateProjectReportMutation,
} from "@/lib/query";
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Divider,
  Group,
  Skeleton,
  Stack,
  Switch,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { AnimatePresence } from "motion/react";
import { CreateReportForm } from "@/components/report/CreateReportForm";
import { Trans } from "@lingui/react/macro";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { IconPrinter, IconSettings, IconShare2 } from "@tabler/icons-react";
import { Icons } from "@/icons";
import { t } from "@lingui/core/macro";
import { ReportRenderer } from "@/components/report/ReportRenderer";
import { PARTICIPANT_BASE_URL } from "@/config";
import { ProjectQRCode } from "@/components/project/ProjectQRCode";
import { CopyIconButton } from "@/components/common/CopyIconButton";
import useCopyToRichText from "@/hooks/useCopyToRichText";
import { ReportTimeline } from "@/components/report/ReportTimeline";
import { useDisclosure } from "@mantine/hooks";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { UpdateReportModalButton } from "@/components/report/UpdateReportModalButton";

export const ReportLayout = ({
  children,
  rightSection,
}: {
  children: React.ReactNode;
  rightSection?: React.ReactNode;
}) => {
  const { projectId, language } = useParams();

  return (
    <Stack
      gap="3rem"
      px={{ base: "1rem", md: "2rem" }}
      py={{ base: "2rem", md: "4rem" }}
    >
      <Group justify="space-between">
        <Breadcrumbs
          items={[
            {
              label: (
                <Group>
                  <Title order={1}>
                    <Trans>Report</Trans>
                  </Title>
                  <Badge>
                    <Trans>Experimental</Trans>
                  </Badge>
                </Group>
              ),
            },
          ]}
        />
        {rightSection}
      </Group>
      {children}
    </Stack>
  );
};

const ProjectReportAnalytics = ({ reportId }: { reportId: number }) => {
  const { data: views } = useProjectReportViews(reportId);

  const [opened, { toggle }] = useDisclosure();

  return (
    <Stack gap="1.5rem">
      <Group>
        <Title order={4}>Analytics</Title>
        <ActionIcon onClick={toggle} variant="transparent" color="gray.9">
          <IconSettings />
        </ActionIcon>
      </Group>
      <Stack gap="1rem">
        <Text>
          <Trans>This report was opened by {views?.total ?? 0} people</Trans>
        </Text>
        <ReportTimeline reportId={String(reportId)} showBrush={opened} />
      </Stack>
    </Stack>
  );
};

export const ProjectReportRoute = () => {
  const { projectId, language } = useParams();
  const { data, isLoading } = useLatestProjectReport(projectId ?? "");
  const { data: views } = useProjectReportViews(data?.id ?? -1);
  const { mutate: updateProjectReport, isPending: isUpdatingReport } =
    useUpdateProjectReportMutation();

  const contributionLink = `${PARTICIPANT_BASE_URL}/${language}/${projectId}/start`;
  const getSharingLink = (data: ProjectReport) =>
    `${PARTICIPANT_BASE_URL}/${language}/${data.project_id}/report`;

  const { copy, copied } = useCopyToRichText();
  const [parent] = useAutoAnimate();

  if (isLoading) {
    return (
      <ReportLayout>
        <Divider />
        <Skeleton height="100px" />
        <Skeleton height="200px" />
      </ReportLayout>
    );
  }

  if (!data) {
    return (
      <ReportLayout>
        <Divider />
        <CreateReportForm onSuccess={() => {}} />
      </ReportLayout>
    );
  }

  if (data.status === "error") {
    return (
      <ReportLayout>
        <Title order={2}>
          <Trans>
            Report generation is currently in beta and limited to projects with
            fewer than 10 hours of recording.
          </Trans>
        </Title>

        <Text>
          <Trans>
            There was an error generating your report. In the meantime, you can
            analyze all your data using the library or select specific
            conversations to chat with.
          </Trans>
        </Text>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      rightSection={
        <Group>
          <AnimatePresence>
            {data.status === "published" && (
              <Group>
                <UpdateReportModalButton reportId={data.id} />

                <Tooltip label={t`Share this report`}>
                  <ActionIcon
                    onClick={() => {
                      const url = getSharingLink(data);
                      if (navigator.canShare({ url })) {
                        navigator.share({ url });
                      } else {
                        window.open(url, "_blank");
                      }
                    }}
                    variant="transparent"
                    color="gray.9"
                    size={24}
                  >
                    <IconShare2 />
                  </ActionIcon>
                </Tooltip>

                <CopyIconButton
                  onCopy={() => {
                    copy(getSharingLink(data));
                  }}
                  copyTooltip={t`Copy link to share this report`}
                  copied={copied}
                  variant="transparent"
                  color="gray.9"
                  size={20}
                />

                <Tooltip label={t`Print this report`}>
                  <ActionIcon
                    onClick={() => {
                      window.open(
                        getSharingLink(data) + "?print=true",
                        "_blank",
                      );
                    }}
                    variant="transparent"
                    color="gray.9"
                    size={24}
                  >
                    <IconPrinter />
                  </ActionIcon>
                </Tooltip>

                <Divider orientation="vertical" />
              </Group>
            )}
          </AnimatePresence>
          <Switch
            label={data.status === "published" ? t`Published` : t`Publish`}
            checked={data.status === "published"}
            onChange={(e) => {
              updateProjectReport({
                reportId: data.id,
                payload: {
                  status: e.target.checked ? "published" : "archived",
                  project_id: data.project_id,
                },
              });
            }}
            disabled={isUpdatingReport}
          />
        </Group>
      }
    >
      <Divider />
      <Stack gap="3rem">
        <ProjectReportAnalytics reportId={data.id} />

        <Stack gap="1.5rem">
          <Title order={4}>Settings</Title>
          <Stack gap="1rem">
            <Checkbox
              label={t`Include portal link in report`}
              checked={data.show_portal_link ?? true}
              onChange={(e) => {
                updateProjectReport({
                  reportId: data.id,
                  payload: {
                    show_portal_link: e.target.checked ? true : false,
                    project_id: data.project_id,
                  },
                });
              }}
              disabled={isUpdatingReport}
            />
            <Checkbox
              label={t`Show timeline in report (request feature)`}
              checked={false}
              disabled
            />
            <Checkbox
              label={t`Password protect portal (request feature)`}
              checked={false}
              disabled
            />
          </Stack>
        </Stack>

        <Divider />
        <ReportRenderer
          reportId={data.id}
          opts={{
            showBorder: true,
            contributeLink: data.show_portal_link
              ? contributionLink
              : undefined,
            readingNow: views?.recent ?? 0,
          }}
        />
      </Stack>
    </ReportLayout>
  );
};
