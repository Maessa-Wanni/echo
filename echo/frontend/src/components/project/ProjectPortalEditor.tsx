import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useState, useEffect } from "react";
import {
  Button,
  Checkbox,
  Divider,
  Group,
  NativeSelect,
  Stack,
  TextInput,
  Title,
  Box,
  Pill,
  Text,
  Paper,
  InputDescription,
} from "@mantine/core";
import { ProjectTagsInput } from "./ProjectTagsInput";
import { MarkdownWYSIWYG } from "../form/MarkdownWYSIWYG/MarkdownWYSIWYG";
import { useUpdateProjectByIdMutation } from "@/lib/query";
import { IconEye, IconEyeOff, IconRefresh } from "@tabler/icons-react";
import { useProjectSharingLink } from "./ProjectQRCode";
import { Resizable } from "re-resizable";
import { FormLabel } from "../form/FormLabel";
import { useForm, Controller } from "react-hook-form";
import { useAutoSave } from "@/hooks/useAutoSave";
import { SaveStatus } from "../form/SaveStatus";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const FormSchema = z.object({
  language: z.enum(["en", "nl", "de", "fr", "es"]),
  default_conversation_ask_for_participant_name: z.boolean(),
  default_conversation_tutorial_slug: z.string(),
  default_conversation_title: z.string(),
  default_conversation_description: z.string(),
  default_conversation_finish_text: z.string(),
  default_conversation_transcript_prompt: z.string(),
});

type ProjectPortalFormValues = z.infer<typeof FormSchema>;

const ProperNounInput = ({
  value,
  onChange,
  isDirty,
}: {
  value: string;
  onChange: (value: string) => void;
  isDirty: boolean;
}) => {
  const [nouns, setNouns] = useState<string[]>([]);
  const [nounInput, setNounInput] = useState("");

  useEffect(() => {
    setNouns(
      value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    );
  }, [value]);

  const handleAddNoun = () => {
    if (nounInput.trim()) {
      const newNouns = [
        ...nouns,
        ...nounInput
          .split(",")
          .map((noun) => noun.trim())
          .filter(Boolean),
      ];
      const uniqueNouns = Array.from(new Set(newNouns));
      setNouns(uniqueNouns);
      onChange(uniqueNouns.join(", "));
      setNounInput("");
    }
  };

  const handleRemoveNoun = (noun: string) => {
    const newNouns = nouns.filter((n) => n !== noun);
    setNouns(newNouns);
    onChange(newNouns.join(", "));
  };

  return (
    <Stack gap="md">
      <TextInput
        className={isDirty ? "border-blue-500" : ""}
        label={<FormLabel label={t`Specific Context`} isDirty={isDirty} />}
        description={
          <Trans>
            Add key terms or proper nouns to improve transcript quality and
            accuracy.
          </Trans>
        }
        value={nounInput}
        onChange={(e) => setNounInput(e.currentTarget.value)}
        placeholder={t`Enter a key term or proper noun`}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAddNoun();
          }
        }}
      />
      <Group gap="xs">
        {nouns.map((noun, index) => (
          <Pill
            key={index}
            withRemoveButton
            onRemove={() => handleRemoveNoun(noun)}
          >
            {noun}
          </Pill>
        ))}
      </Group>
    </Stack>
  );
};

export const ProjectPortalEditor = ({ project }: { project: Project }) => {
  const [showPreview, setShowPreview] = useState(false);
  const link = useProjectSharingLink(project);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewWidth, setPreviewWidth] = useState(400);
  const [previewHeight, setPreviewHeight] = useState(300);

  const { control, handleSubmit, watch, formState, reset } =
    useForm<ProjectPortalFormValues>({
      defaultValues: {
        default_conversation_tutorial_slug:
          project.default_conversation_tutorial_slug ?? "none",
        default_conversation_ask_for_participant_name:
          project.default_conversation_ask_for_participant_name ?? false,
        default_conversation_title: project.default_conversation_title ?? "",
        default_conversation_description:
          project.default_conversation_description ?? "",
        default_conversation_finish_text:
          project.default_conversation_finish_text ?? "",
        language:
          (project.language as "en" | "nl" | "de" | "fr" | "es") ?? "en",
        default_conversation_transcript_prompt:
          project.default_conversation_transcript_prompt ?? "",
      },
      // for validation
      resolver: zodResolver(FormSchema),
      mode: "onChange",
      reValidateMode: "onChange",
    });

  const updateProjectMutation = useUpdateProjectByIdMutation();

  const onSave = async (values: ProjectPortalFormValues) => {
    console.log("[ProjectPortalEditor] Saving values:", values);
    const data = await updateProjectMutation.mutateAsync({
      id: project.id,
      payload: values,
    });
    console.log("[ProjectPortalEditor] Save response:", data);

    // Reset the form with the current values to clear the dirty state
    reset(values, { keepDirty: false, keepValues: true });
  };

  const {
    dispatchAutoSave,
    triggerManualSave,
    isPendingSave,
    isSaving,
    isError,
    lastSavedAt,
  } = useAutoSave({
    onSave,
    initialLastSavedAt: project.updated_at ?? new Date(),
  });

  useEffect(() => {
    console.log("[ProjectPortalEditor] Setting up form watch");
    const subscription = watch((values, { type }) => {
      if (type === "change" && values) {
        console.log("[ProjectPortalEditor] Form values changed:", values);
        dispatchAutoSave(values as ProjectPortalFormValues);
      }
    });

    return () => {
      console.log("[ProjectPortalEditor] Cleaning up form watch");
      subscription.unsubscribe();
    };
  }, [watch, dispatchAutoSave]);

  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  return (
    <Box>
      <Stack gap="3rem">
        <Group justify="space-between">
          <Group>
            <Title order={2}>
              <Trans>Portal Editor</Trans>
            </Title>
            <SaveStatus
              formErrors={formState.errors}
              savedAt={lastSavedAt}
              isPendingSave={isPendingSave}
              isSaving={isSaving}
              isError={isError}
            />
          </Group>
          {/* <Button
            variant="subtle"
            onClick={() => setShowPreview(!showPreview)}
            leftSection={
              showPreview ? <IconEyeOff size={16} /> : <IconEye size={16} />
            }
          >
            <Trans>{showPreview ? "Hide Preview" : "Show Preview"}</Trans>
          </Button> */}
        </Group>

        <div className="relative flex h-auto flex-col gap-8 lg:flex-row lg:justify-start">
          <div className="max-w-[800px] flex-1">
            <form
              onSubmit={handleSubmit(async (values) => {
                console.log(
                  "[ProjectPortalEditor] Manual save triggered:",
                  values,
                );
                await triggerManualSave(values);
              })}
            >
              <Stack gap="3rem">
                <Stack gap="1.5rem">
                  <Title order={3}>
                    <Trans>Basic Settings</Trans>
                  </Title>
                  <Stack gap="2rem">
                    <Controller
                      name="language"
                      control={control}
                      render={({ field }) => (
                        <NativeSelect
                          label={
                            <FormLabel
                              label={t`Language`}
                              isDirty={formState.dirtyFields.language}
                              error={formState.errors.language?.message}
                            />
                          }
                          description={t`This language will be used for the Participant's Portal and transcription.`}
                          data={[
                            { label: t`English`, value: "en" },
                            { label: t`Dutch`, value: "nl" },
                            { label: t`German`, value: "de" },
                            { label: t`Spanish`, value: "es" },
                            { label: t`French`, value: "fr" },
                          ]}
                          {...field}
                        />
                      )}
                    />
                    {/* <Controller
                      name="default_conversation_ask_for_participant_name"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          label={
                            <FormLabel
                              label={t`Ask for Name?`}
                              isDirty={
                                formState.dirtyFields
                                  .default_conversation_ask_for_participant_name
                              }
                              error={
                                formState.errors
                                  .default_conversation_ask_for_participant_name
                                  ?.message
                              }
                            />
                          }
                          description={
                            <Trans>
                              Ask participants to provide their name when they
                              start a conversation
                            </Trans>
                          }
                          checked={field.value}
                          onChange={(e) =>
                            field.onChange(e.currentTarget.checked)
                          }
                        />
                      )}
                    /> */}
                    <Controller
                      name="default_conversation_tutorial_slug"
                      control={control}
                      render={({ field }) => (
                        <NativeSelect
                          label={
                            <FormLabel
                              label={t`Select tutorial`}
                              isDirty={
                                formState.dirtyFields
                                  .default_conversation_tutorial_slug
                              }
                              error={
                                formState.errors
                                  .default_conversation_tutorial_slug?.message
                              }
                            />
                          }
                          description={
                            <Trans>
                              Select the instructions that will be shown to
                              participants when they start a conversation
                            </Trans>
                          }
                          data={[
                            {
                              label: t`No tutorial (only Privacy statements)`,
                              value: "none",
                            },
                            {
                              label: t`Basic (Essential tutorial slides)`,
                              value: "basic",
                            },
                            {
                              label: t`Advanced (Tips and tricks)`,
                              value: "advanced",
                            },
                          ]}
                          {...field}
                        />
                      )}
                    />
                    {/* <ProjectTagsInput project={project} /> */}
                  </Stack>
                </Stack>

                {/* <Divider />

                <Stack gap="1.5rem">
                  <Title order={3}>
                    <Trans>Portal Content</Trans>
                  </Title>
                  <Stack gap="2rem">
                    <Controller
                      name="default_conversation_title"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          label={
                            <FormLabel
                              label={t`Page Title`}
                              isDirty={
                                formState.dirtyFields.default_conversation_title
                              }
                              error={
                                formState.errors.default_conversation_title
                                  ?.message
                              }
                            />
                          }
                          description={
                            <Trans>
                              This title is shown to participants when they
                              start a conversation
                            </Trans>
                          }
                          {...field}
                        />
                      )}
                    />

                    <Stack gap="xs">
                      <FormLabel
                        label={t`Page Content`}
                        isDirty={
                          formState.dirtyFields.default_conversation_description
                        }
                        error={
                          formState.errors.default_conversation_description
                            ?.message
                        }
                      />
                      <InputDescription>
                        <Trans>
                          This page is shown to participants when they start a
                          conversation after they successfully complete the
                          tutorial.
                        </Trans>
                      </InputDescription>
                      <Controller
                        name="default_conversation_description"
                        control={control}
                        render={({ field }) => (
                          <MarkdownWYSIWYG
                            markdown={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </Stack>

                    <Stack gap="xs">
                      <FormLabel
                        label={t`Thank You Page Content`}
                        isDirty={
                          formState.dirtyFields.default_conversation_finish_text
                        }
                        error={
                          formState.errors.default_conversation_finish_text
                            ?.message
                        }
                      />
                      <InputDescription>
                        <Trans>
                          This page is shown after the participant has completed
                          the conversation.
                        </Trans>
                      </InputDescription>
                      <Controller
                        name="default_conversation_finish_text"
                        control={control}
                        render={({ field }) => (
                          <MarkdownWYSIWYG
                            markdown={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </Stack>
                  </Stack>
                </Stack> */}

                <Divider />

                <Stack gap="1.5rem">
                  <Title order={3}>
                    <Trans>Advanced Settings</Trans>
                  </Title>
                  <Controller
                    name="default_conversation_transcript_prompt"
                    control={control}
                    render={({ field }) => (
                      <ProperNounInput
                        isDirty={
                          formState.dirtyFields
                            .default_conversation_transcript_prompt ?? false
                        }
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Stack>

                <Divider />
              </Stack>
            </form>
          </div>

          {showPreview && link && (
            <div className="relative">
              <div className="sticky top-4 min-h-[60vh]">
                <Resizable
                  size={{ width: previewWidth, height: previewHeight }}
                  minWidth={300}
                  maxWidth={500}
                  minHeight="70vh"
                  maxHeight="100vh"
                  onResizeStop={(_e, _direction, _ref, d) => {
                    setPreviewWidth(previewWidth + d.width);
                    setPreviewHeight(previewHeight + d.height);
                  }}
                  enable={{
                    left: true,
                    bottom: true,
                    right: false,
                    bottomLeft: false,
                    bottomRight: false,
                    top: false,
                    topLeft: false,
                    topRight: false,
                  }}
                  handleStyles={{
                    left: {
                      width: "8px",
                      left: "-4px",
                      cursor: "col-resize",
                    },
                    bottom: {
                      height: "8px",
                      bottom: "-4px",
                      cursor: "row-resize",
                    },
                  }}
                  handleClasses={{
                    left: "hover:bg-blue-500/20",
                    bottom: "hover:bg-blue-500/20",
                  }}
                >
                  <Paper
                    shadow="sm"
                    withBorder
                    className="flex h-full flex-col"
                  >
                    <Stack gap="xs" px="md" py="md">
                      <Group justify="space-between">
                        <Title order={4}>
                          <Trans>Live Preview</Trans>
                        </Title>
                        <Button
                          variant="subtle"
                          size="compact-sm"
                          onClick={refreshPreview}
                          leftSection={<IconRefresh size={16} />}
                        >
                          <Trans>Refresh</Trans>
                        </Button>
                      </Group>
                      <Text size="sm" c="dimmed">
                        <Trans>
                          This is a live preview of the participant's portal.
                          You will need to refresh the page to see the latest
                          changes.
                        </Trans>
                      </Text>
                    </Stack>

                    <Divider />

                    <iframe
                      key={previewKey}
                      src={link}
                      className="h-full w-full flex-1 bg-white"
                      title="Portal Preview"
                    />
                  </Paper>
                </Resizable>
              </div>
            </div>
          )}
        </div>
      </Stack>
    </Box>
  );
};
