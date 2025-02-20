import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
  useCreateProjectTagMutation,
  useDeleteTagByIdMutation,
  useProjectById,
  useUpdateProjectTagByIdMutation,
} from "@/lib/query";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  LoadingOverlay,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useState } from "react";
import {
  DragEndEvent,
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconX } from "@tabler/icons-react";
import { FormLabel } from "../form/FormLabel";

export const ProjectTagPill = ({ tag }: { tag: ProjectTag }) => {
  const deleteTagMutation = useDeleteTagByIdMutation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tag.id,
    // @ts-expect-error prevent accidental drag
    activationConstraint: {
      distance: 8,
    },
  });

  if (!tag || !tag.text) {
    return null;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (
      !isDragging &&
      window.confirm(
        t`Are you sure you want to delete this tag? This will remove the tag from existing conversations that contain it.`,
      )
    ) {
      deleteTagMutation.mutate(tag.id);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          height: "var(--pill-height)",
          background: "var(--mantine-color-primary-1)",
          paddingInline: "0.8em",
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "var(--pill-radius, 1000rem)",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
        {...attributes}
        {...listeners}
      >
        <Text size="sm" className="font-normal">
          {tag.text}
        </Text>
        <ActionIcon
          onClick={(e) => handleDelete(e)}
          size="xs"
          variant="transparent"
          c="gray.8"
          className="ml-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <IconX />
        </ActionIcon>
      </div>
    </>
  );
};

export const ProjectTagsInput = (props: { project: Project }) => {
  const projectQuery = useProjectById({ projectId: props.project.id });
  const createTagMutation = useCreateProjectTagMutation();
  const updateTagMutation = useUpdateProjectTagByIdMutation();

  const [tagInput, setTagInput] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleSubmit = async () => {
    if (!tagInput.trim()) return;

    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const currentMaxSort = Math.max(
      0,
      ...(projectQuery.data?.tags?.map((t) => t.sort ?? 0) ?? []),
    );

    // Wait for all tag creation mutations to complete
    await Promise.all(
      tags.map((tag, index) =>
        createTagMutation.mutateAsync({
          // @ts-expect-error directus user id is not required
          project_id: {
            id: props.project.id,
          },
          text: tag,
          sort: currentMaxSort + index + 1,
        }),
      ),
    );

    setTagInput("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over || active.id === over.id) return;

    const oldIndex = projectQuery.data?.tags?.findIndex(
      (tag) => tag.id === active.id,
    );
    const newIndex = projectQuery.data?.tags?.findIndex(
      (tag) => tag.id === over.id,
    );

    if (
      oldIndex === undefined ||
      newIndex === undefined ||
      !projectQuery.data?.tags
    )
      return;

    // Create new array with updated positions
    const newTags = arrayMove(projectQuery.data.tags, oldIndex, newIndex);

    // Update sort values for all affected tags
    newTags.forEach((tag: ProjectTag, index: number) => {
      updateTagMutation.mutate({
        id: tag.id,
        project_id: props.project.id,
        payload: {
          sort: index + 1, // Sort starts from 1
        },
      });
    });
  };

  if (projectQuery.isLoading) {
    return (
      <Stack>
        <Skeleton height={30} />
      </Stack>
    );
  }

  // Sort tags by sort field before rendering
  const sortedTags = [...(projectQuery.data?.tags ?? [])].sort(
    (a, b) => (a.sort ?? Infinity) - (b.sort ?? Infinity),
  );

  return (
    <Stack className="relative">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <Box>
        {createTagMutation.isError && (
          <Text c="red" size="sm">
            {createTagMutation.error.message}
          </Text>
        )}
        <Stack gap="sm">
          <Group align="end">
            <TextInput
              label={
                <FormLabel
                  label={t`Tags`}
                  isDirty={tagInput.trim().length > 0}
                />
              }
              description={t`Participants will be able to select tags when creating conversations`}
              value={tagInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              onChange={(e) => setTagInput(e.currentTarget.value)}
            />
            <Button
              loading={createTagMutation.isPending}
              onClick={handleSubmit}
              variant="outline"
              disabled={!tagInput.trim() || createTagMutation.isPending}
            >
              {tagInput.includes(",") ? t`Add Tags` : t`Add Tag`}
            </Button>
          </Group>
          <Group gap="sm">
            {(projectQuery.data?.tags?.length ?? 0) === 0 ? (
              <Alert>
                <Text size="sm">
                  <Trans>
                    No tags have been added to this project yet. Add a tag using
                    the text input above to get started.
                  </Trans>
                </Text>
              </Alert>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedTags.map((tag) => tag.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {sortedTags.map((tag) => (
                    <ProjectTagPill key={tag.id} tag={tag} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </Group>
        </Stack>
      </Box>
    </Stack>
  );
};