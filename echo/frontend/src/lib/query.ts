// conventions
// query key uses the following format: projects , chats (plural)
// mutation key uses the following format: projects , chats (plural)
import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useI18nNavigate } from "@/hooks/useI18nNavigate";
import {
  addChatContext,
  api,
  createProjectReport,
  deleteChatContext,
  deleteResourceById,
  generateProjectLibrary as generateProjectLibrary,
  generateProjectView,
  getChatHistory,
  getConversationTranscriptString,
  getLatestProjectAnalysisRunByProjectId,
  getProjectChatContext,
  getProjectInsights,
  getProjectViews,
  getQuotesByConversationId,
  getResourceById,
  getResourcesByProjectId,
  initiateAndUploadConversationChunk,
  initiateConversation,
  lockConversations,
  updateResourceById,
  uploadConversationChunk,
  uploadConversationText,
  uploadResourceByProjectId,
} from "./api";
import { toast } from "@/components/common/Toaster";
import { directus } from "./directus";
import {
  Query,
  aggregate,
  createItem,
  deleteItem,
  passwordRequest,
  passwordReset,
  readItem,
  readItems,
  readUser,
  registerUser,
  registerUserVerify,
  updateItem,
} from "@directus/sdk";
import { ADMIN_BASE_URL } from "@/config";
import { AxiosError } from "axios";

// always throws a error with a message
function throwWithMessage(e: unknown): never {
  if (
    e &&
    typeof e === "object" &&
    "errors" in e &&
    Array.isArray((e as any).errors)
  ) {
    // Handle Directus error format
    const message = (e as any).errors[0].message;
    console.log(message);
    throw new Error(message);
  } else if (e instanceof Error) {
    // Handle generic errors
    console.log(e.message);
    throw new Error(e.message);
  } else {
    // Handle unknown errors
    console.log("An unknown error occurred");
    throw new Error("Something went wrong");
  }
}

export const useProjects = ({
  query,
}: {
  query: Partial<Query<CustomDirectusTypes, Project>>;
}) => {
  return useQuery({
    queryKey: ["projects", query],
    queryFn: () =>
      directus.request(
        readItems("project", {
          fields: [
            "*",
            {
              tags: ["*"],
            },
          ],
          deep: {
            // @ts-expect-error tags is not typed
            tags: {
              _sort: "sort",
            },
          },
          ...query,
        }),
      ),
  });
};

export const useInfiniteProjects = ({
  query,
  options = {
    initialLimit: 15,
  },
}: {
  query: Partial<Query<CustomDirectusTypes, Project>>;
  options?: {
    initialLimit?: number;
  };
}) => {
  const { initialLimit = 15 } = options;

  return useInfiniteQuery({
    queryKey: ["projects", query],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await directus.request(
        readItems("project", {
          ...query,
          limit: initialLimit,
          offset: pageParam * initialLimit,
        }),
      );

      return {
        projects: response,
        nextOffset:
          response.length === initialLimit ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
};

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Project>) => {
      return api.post<unknown, TProject>("/projects", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
    },
    onError: (e) => {
      console.error(e);
      toast.error("Error creating project");
    },
  });
};

// todo: add redirection logic here
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (payload: Parameters<typeof directus.login>) => {
      return directus.login(...payload);
    },
    onSuccess: () => {
      toast.success("Login successful");
    },
  });
};

export const useRegisterMutation = () => {
  const navigate = useI18nNavigate();
  return useMutation({
    mutationFn: async (payload: Parameters<typeof registerUser>) => {
      try {
        const response = await directus.request(registerUser(...payload));
        return response;
      } catch (e) {
        try {
          throwWithMessage(e);
        } catch (inner) {
          if (inner instanceof Error) {
            if (inner.message === "You don't have permission to access this.") {
              throw new Error(
                "Oops! It seems your email is not eligible for registration at this time. Please consider joining our waitlist for future updates!",
              );
            }
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("Please check your email to verify your account.");
      navigate("/check-your-email");
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });
};

export const useVerifyMutation = (doRedirect: boolean = true) => {
  const navigate = useI18nNavigate();

  return useMutation({
    mutationFn: async (data: { token: string }) => {
      try {
        const response = await directus.request(registerUserVerify(data.token));
        return response;
      } catch (e) {
        throwWithMessage(e);
      }
    },
    onSuccess: () => {
      toast.success("Email verified successfully.");
      if (doRedirect) {
        setTimeout(() => {
          // window.location.href = `/login?new=true`;
          navigate(`/login?new=true`);
        }, 4500);
      }
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });
};

export const useRequestPasswordResetMutation = () => {
  const navigate = useI18nNavigate();
  return useMutation({
    mutationFn: async (email: string) => {
      try {
        const response = await directus.request(
          passwordRequest(email, `${ADMIN_BASE_URL}/password-reset`),
        );
        return response;
      } catch (e) {
        throwWithMessage(e);
      }
    },
    onSuccess: () => {
      toast.success("Password reset email sent successfully");
      navigate("/check-your-email");
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });
};

export const useResetPasswordMutation = () => {
  const navigate = useI18nNavigate();
  return useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) => {
      try {
        const response = await directus.request(passwordReset(token, password));
        return response;
      } catch (e) {
        throwWithMessage(e);
      }
    },
    onSuccess: () => {
      toast.success(
        "Password reset successfully. Please login with new password.",
      );
      navigate("/login");
    },
    onError: (e) => {
      try {
        toast.error(e.message);
      } catch (e) {
        toast.error("Error resetting password. Please contact support.");
      }
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useI18nNavigate();

  return useMutation({
    mutationFn: async ({
      next: _,
    }: {
      next?: string;
      reason?: string;
      doRedirect: boolean;
    }) => {
      try {
        await directus.logout();
      } catch (e) {
        throwWithMessage(e);
      }
    },
    onMutate: async ({ next, reason, doRedirect }) => {
      queryClient.resetQueries();
      if (doRedirect) {
        navigate(
          "/login" +
            (next ? `?next=${encodeURIComponent(next)}` : "") +
            (reason ? `&reason=${reason}` : ""),
        );
      }
    },
  });
};

export const useProjectById = ({
  projectId,
  query = {
    fields: [
      "*",
      {
        tags: ["id", "created_at", "text", "sort"],
      },
    ],
    deep: {
      // @ts-expect-error tags won't be typed
      tags: {
        _sort: "sort",
      },
    },
  },
}: {
  projectId: string;
  query?: Partial<Query<CustomDirectusTypes, Project>>;
}) => {
  return useQuery({
    queryKey: ["projects", projectId, query],
    queryFn: () =>
      directus.request<Project>(readItem("project", projectId, query)),
  });
};

export const useProjectInsights = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "insights"],
    queryFn: () => getProjectInsights(projectId),
  });
};

export const useInsight = (insightId: string) => {
  return useQuery({
    queryKey: ["insights", insightId],
    queryFn: () =>
      directus.request<Insight>(
        readItem("insight", insightId, {
          fields: [
            "*",
            {
              quotes: [
                "*",
                {
                  conversation_id: ["id", "participant_name", "created_at"],
                },
              ],
            },
          ],
        }),
      ),
  });
};

export const useProjectViews = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "views"],
    queryFn: () => getProjectViews(projectId),
    refetchInterval: 20000,
  });
};

export const useViewById = (projectId: string, viewId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "views", viewId],
    queryFn: () =>
      directus.request<View>(
        readItem("view", viewId, {
          fields: ["*", { aspects: ["*", "count(quotes)"] }],
          deep: {
            // get the aspects that have at least one representative quote
            aspects: {
              _sort: "-count(representative_quotes)",
            } as any,
          },
        }),
      ),
  });
};

export const useAspectById = (projectId: string, aspectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "aspects", aspectId],
    queryFn: () =>
      directus.request<Aspect>(
        readItem("aspect", aspectId, {
          fields: [
            "*",
            {
              quotes: [
                "*",
                {
                  quote_id: [
                    "id",
                    "text",
                    "created_at",
                    {
                      conversation_id: ["id", "participant_name", "created_at"],
                    },
                  ],
                },
              ],
            },
            {
              representative_quotes: [
                "*",
                {
                  quote_id: [
                    "id",
                    "text",
                    "created_at",
                    {
                      conversation_id: ["id", "participant_name", "created_at"],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ),
  });
};

export const useUpdateProjectTagByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      project_id: string;
      payload: Partial<ProjectTag>;
    }) => directus.request<ProjectTag>(updateItem("project_tag", id, payload)),
    onSuccess: (_values, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.project_id],
      });
    },
  });
};

export const useUpdateProjectByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Project> }) =>
      directus.request<Project>(updateItem("project", id, payload)),
    onSuccess: (_values, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.id],
      });
      toast.success("Project updated successfully");
    },
  });
};

export const useDeleteProjectByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      directus.request(deleteItem("project", projectId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      queryClient.resetQueries();
      toast.success("Project deleted successfully");
    },
  });
};

export const useResourceById = (resourceId: string) => {
  return useQuery({
    queryKey: ["resources", resourceId],
    queryFn: () => getResourceById(resourceId),
  });
};

export const useResourcesByProjectId = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "resources"],
    queryFn: () => getResourcesByProjectId(projectId),
  });
};

export const useUploadResourceByProjectIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadResourceByProjectId,
    retry: 3,
    onSuccess: (_values, variables) => {
      const projectId = variables.projectId;
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "resources"],
      });
      toast.success("Resource uploaded successfully");
    },
  });
};

export const useUpdateResourceByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateResourceById,
    onSuccess: (_values, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["resources", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      toast.success("Resource updated successfully");
    },
  });
};

export const useDeleteResourceByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResourceById,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["resources"],
      });
      toast.success("Resource deleted successfully");
    },
  });
};

export const useInitiateConversationMutation = () => {
  return useMutation({
    mutationFn: initiateConversation,
    onSuccess: () => {
      toast.success("Success");
    },
    onError: () => {
      toast.error("Invalid PIN or email. Please try again.");
    },
  });
};

export const useConversationById = ({
  conversationId,
  loadConversationChunks = false,
  query = {},
  useQueryOpts = {
    refetchInterval: 10000,
  },
}: {
  conversationId: string;
  loadConversationChunks?: boolean;
  // query overrides the default query and loadChunks
  query?: Partial<Query<CustomDirectusTypes, Conversation>>;
  useQueryOpts?: Partial<UseQueryOptions<Conversation>>;
}) => {
  return useQuery({
    queryKey: ["conversations", conversationId, loadConversationChunks, query],
    queryFn: () =>
      directus.request<Conversation>(
        readItem("conversation", conversationId, {
          fields: [
            "*",
            {
              tags: [
                {
                  project_tag_id: ["id", "text", "created_at"],
                },
              ],
            },
            ...(loadConversationChunks ? [{ chunks: ["*"] as any }] : []),
          ],
          ...query,
        }),
      ),
    ...useQueryOpts,
  });
};

export const useConversationQuotes = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversations", conversationId, "quotes"],
    queryFn: () => getQuotesByConversationId(conversationId),
  });
};

export const useUpdateConversationByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Conversation>;
    }) =>
      directus.request<Conversation>(updateItem("conversation", id, payload)),
    onSuccess: (values, variables) => {
      queryClient.setQueryData(
        ["conversations", variables.id],
        (oldData: Conversation | undefined) => {
          return {
            ...oldData,
            ...values,
          };
        },
      );
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });
};

// you always need to provide all the tags
export const useUpdateConversationTagsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      projectId,
      projectTagIdList,
    }: {
      projectId: string;
      conversationId: string;
      projectTagIdList: string[];
    }) => {
      const validTags = await directus.request<ProjectTag[]>(
        readItems("project_tag", {
          filter: {
            id: {
              _in: projectTagIdList,
            },
            project_id: {
              _eq: projectId,
            },
          },
          fields: ["*"],
        }),
      );

      return directus.request<Conversation>(
        updateItem("conversation", conversationId, {
          tags: validTags.map((tag) => ({
            project_tag_id: tag.id,
            conversation_id: conversationId,
          })),
        }),
      );
    },
    onSuccess: (_values, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.projectId],
      });
    },
  });
};

export const useDeleteConversationByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      directus.request(deleteItem("conversation", conversationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      toast.success("Conversation deleted successfully");
    },
  });
};

export const useDeleteConversationChunkByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chunkId: string) =>
      directus.request(deleteItem("conversation_chunk", chunkId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });
};

export const useConversationsByProjectId = (
  projectId: string,
  loadChunks?: boolean,
  loadWhereTranscriptExists?: boolean,
  query?: Partial<Query<CustomDirectusTypes, Conversation>>,
) => {
  return useQuery({
    queryKey: [
      "projects",
      projectId,
      "conversations",
      loadChunks ? "chunks" : "no-chunks",
      loadWhereTranscriptExists ? "transcript" : "no-transcript",
      query,
    ],
    queryFn: () =>
      directus.request(
        readItems("conversation", {
          sort: "-updated_at",
          fields: [
            "*",
            {
              tags: [
                {
                  project_tag_id: ["id", "text", "created_at"],
                },
              ],
            },
            { chunks: ["*"] },
          ],
          deep: {
            // @ts-expect-error chunks is not typed
            chunks: {
              _limit: loadChunks ? 1000 : 1,
            },
          },
          filter: {
            project_id: {
              _eq: projectId,
            },
            chunks: {
              ...(loadWhereTranscriptExists && {
                _some: {
                  transcript: {
                    _nempty: true,
                  },
                },
              }),
            },
          },
          limit: 1000,
          ...query,
        }),
      ),
    refetchInterval: 30000,
  });
};

export const useUploadConversationChunk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadConversationChunk,
    retry: 10,
    // When mutate is called:
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: ["conversations", variables.conversationId, "chunks"],
      });

      await queryClient.cancelQueries({
        queryKey: [
          "participant",
          "conversation_chunks",
          variables.conversationId,
        ],
      });

      // Snapshot the previous value
      const previousChunks = queryClient.getQueryData([
        "conversations",
        variables.conversationId,
        "chunks",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["conversations", variables.conversationId, "chunks"],
        (oldData: ConversationChunk[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: "optimistic-" + Date.now(),
                  conversation_id: variables.conversationId,
                  created_at: new Date().toISOString(),
                  timestamp: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  transcript: undefined,
                } as ConversationChunk,
              ]
            : [];
        },
      );

      queryClient.setQueryData(
        ["participant", "conversation_chunks", variables.conversationId],
        (oldData: ConversationChunk[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: "optimistic-" + Date.now(),
                  conversation_id: variables.conversationId,
                  created_at: new Date().toISOString(),
                  timestamp: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  transcript: undefined,
                } as ConversationChunk,
              ]
            : [];
        },
      );

      // Return a context object with the snapshotted value
      return { previousChunks };
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (_err, variables, context) => {
      queryClient.setQueryData(
        ["conversations", variables.conversationId, "chunks"],
        context?.previousChunks,
      );
    },
    // Always refetch after error or success:
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.conversationId],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "participant",
          "conversation_chunks",
          variables.conversationId,
        ],
      });
    },
  });
};

export const useUploadConversationTextChunk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadConversationText,
    retry: 10,
    // When mutate is called:
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: ["conversations", variables.conversationId, "chunks"],
      });

      await queryClient.cancelQueries({
        queryKey: [
          "participant",
          "conversation_chunks",
          variables.conversationId,
        ],
      });

      // Snapshot the previous value
      const previousChunks = queryClient.getQueryData([
        "conversations",
        variables.conversationId,
        "chunks",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["conversations", variables.conversationId, "chunks"],
        (oldData: ConversationChunk[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: "optimistic-" + Date.now(),
                  conversation_id: variables.conversationId,
                  created_at: new Date().toISOString(),
                  timestamp: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  transcript: undefined,
                } as ConversationChunk,
              ]
            : [];
        },
      );

      queryClient.setQueryData(
        ["participant", "conversation_chunks", variables.conversationId],
        (oldData: ConversationChunk[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: "optimistic-" + Date.now(),
                  conversation_id: variables.conversationId,
                  created_at: new Date().toISOString(),
                  timestamp: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  transcript: undefined,
                } as ConversationChunk,
              ]
            : [];
        },
      );

      // Return a context object with the snapshotted value
      return { previousChunks };
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (_err, variables, context) => {
      queryClient.setQueryData(
        ["conversations", variables.conversationId, "chunks"],
        context?.previousChunks,
      );
    },
    // Always refetch after error or success:
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.conversationId, "chunks"],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "participant",
          "conversation_chunks",
          variables.conversationId,
        ],
      });
    },
  });
};

export const useUploadConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiateAndUploadConversationChunk,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      toast.success("Conversation(s) uploaded successfully");
    },
    retry: 10,
  });
};

export const useConversationChunks = (
  conversationId: string,
  refetchInterval: number = 10000,
) => {
  return useQuery({
    queryKey: ["conversations", conversationId, "chunks"],
    queryFn: () =>
      directus.request(
        readItems("conversation_chunk", {
          filter: {
            conversation_id: {
              _eq: conversationId,
            },
          },
          sort: "timestamp",
        }),
      ),
    refetchInterval,
  });
};

export const useInfiniteConversationChunks = (
  conversationId: string,
  options?: {
    initialLimit?: number;
    refetchInterval?: number | false;
  },
) => {
  const defaultOptions = {
    initialLimit: 10,
    refetchInterval: 30000,
  };

  const { initialLimit, refetchInterval } = { ...defaultOptions, ...options };

  return useInfiniteQuery({
    queryKey: ["conversations", conversationId, "chunks", "infinite"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await directus.request(
        readItems("conversation_chunk", {
          filter: {
            conversation_id: {
              _eq: conversationId,
            },
          },
          sort: ["timestamp"],
          limit: initialLimit,
          offset: pageParam * initialLimit,
        }),
      );

      return {
        chunks: response,
        nextOffset:
          response.length === initialLimit ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    refetchInterval,
  });
};

export const useDeleteTagByIdMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) =>
      directus.request(deleteItem("project_tag", tagId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      toast.success("Tag deleted successfully");
    },
  });
};

export const useCreateProjectTagMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      project_id: {
        id: string;
        directus_user_id: string;
      };
      text: string;
      sort?: number;
    }) => directus.request(createItem("project_tag", payload as any)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.project_id.id],
      });
      toast.success("Tag created successfully");
    },
  });
};

export const useGenerateProjectLibraryMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: generateProjectLibrary,
    onSuccess: (_, variables) => {
      toast.success("Analysis requested successfully");
      client.invalidateQueries({ queryKey: ["projects", variables.projectId] });
    },
  });
};

export const useGenerateProjectViewMutation = () => {
  return useMutation({
    mutationFn: generateProjectView,
    onSuccess: () => {
      toast.success("Analysis requested successfully");
    },
  });
};

export const useLatestProjectAnalysisRunByProjectId = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "latest_analysis"],
    queryFn: () => getLatestProjectAnalysisRunByProjectId(projectId),
    refetchInterval: 10000,
  });
};

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["users", "me"],
    queryFn: () => {
      try {
        return directus.request(readUser("me"));
      } catch (error) {
        return null;
      }
    },
  });

export const useConversationTranscriptString = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversations", conversationId, "transcript"],
    queryFn: () => getConversationTranscriptString(conversationId),
  });
};

// export const useConversationTokenCount = (conversationId: string) => {
//   return useQuery({
//     queryKey: ["conversations", conversationId, "token_count"],
//     queryFn: () => getConversationTokenCount(conversationId),
//   });
// };

export const useInsightsByConversationId = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversations", conversationId, "insights"],
    queryFn: () =>
      directus.request(
        readItems("insight", {
          filter: {
            quotes: {
              _some: {
                conversation_id: {
                  _eq: conversationId,
                },
              },
            },
          },
        }),
      ),
  });
};

export const useCreateChatMutation = () => {
  const navigate = useI18nNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      navigateToNewChat?: boolean;
      conversationId?: string;
      project_id: {
        id: string;
      };
    }) => {
      const chat = await directus.request(
        createItem("project_chat", payload as any),
      );

      try {
        if (payload.conversationId) {
          await addChatContext(chat.id, payload.conversationId);
        }
      } catch (error) {
        console.error("Failed to add conversation to chat:", error);
        toast.error("Failed to add conversation to chat");
      }

      if (payload.navigateToNewChat && chat && chat.id) {
        navigate(`/projects/${payload.project_id.id}/chats/${chat.id}`);
      }

      return chat;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.project_id.id, "chats"],
      });
      toast.success("Chat created successfully");
    },
  });
};

export const useDeleteChatMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { chatId: string; projectId: string }) =>
      directus.request(deleteItem("project_chat", payload.chatId)),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", vars.projectId, "chats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["chats", vars.chatId],
      });
      toast.success("Chat deleted successfully");
    },
  });
};

export const useChat = (chatId: string) => {
  return useQuery({
    queryKey: ["chats", chatId],
    queryFn: () =>
      directus.request(
        readItem("project_chat", chatId, {
          fields: [
            "*",
            {
              used_conversations: ["*"],
            },
          ],
        }),
      ),
  });
};

export const useUpdateChatMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      chatId: string;
      // for invalidating the chat query
      projectId: string;
      payload: Partial<ProjectChat>;
    }) =>
      directus.request(
        updateItem("project_chat", payload.chatId, {
          project_id: {
            id: payload.projectId,
          },
          ...payload.payload,
        }),
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", vars.projectId, "chats"],
      });

      queryClient.invalidateQueries({
        queryKey: ["chats", vars.chatId],
      });
      toast.success("Chat updated successfully");
    },
  });
};

export const useProjectChats = (
  projectId: string,
  query?: Partial<Query<CustomDirectusTypes, ProjectChat>>,
) => {
  return useQuery({
    queryKey: ["projects", projectId, "chats", query],
    queryFn: () =>
      directus.request(
        readItems("project_chat", {
          fields: ["id", "project_id", "date_created", "date_updated", "name"],
          sort: "-date_created",
          filter: {
            project_id: {
              _eq: projectId,
            },
          },
          ...query,
        }),
      ),
  });
};

export const useProjectChatContext = (chatId: string) => {
  return useQuery({
    queryKey: ["chats", "context", chatId],
    queryFn: () => getProjectChatContext(chatId),
    enabled: chatId !== "",
  });
};

export const useAddChatContextMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { chatId: string; conversationId: string }) =>
      addChatContext(payload.chatId, payload.conversationId),
    onError: (error) => {
      if (error instanceof AxiosError) {
        alert(
          "Failed to add conversation to chat: " + error.response?.data.detail,
        );
      } else {
        alert("Failed to add conversation to chat");
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["chats", "context", vars.chatId],
      });
      toast.success("Conversation added to chat");
    },
  });
};

export const useDeleteChatContextMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { chatId: string; conversationId: string }) =>
      deleteChatContext(payload.chatId, payload.conversationId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["chats", "context", vars.chatId],
      });
      toast.success("Conversation removed from chat");
    },
  });
};

export const useChatHistory = (chatId: string) => {
  return useQuery({
    queryKey: ["chats", "history", chatId],
    queryFn: () => getChatHistory(chatId ?? ""),
  });
};

export const useLockConversationsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { chatId: string }) =>
      lockConversations(payload.chatId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["chats", "context", vars.chatId],
      });
      queryClient.invalidateQueries({
        queryKey: ["chats", "history", vars.chatId],
      });
    },
  });
};

export const useAddChatMessageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProjectChatMessage>) =>
      directus.request(createItem("project_chat_message", payload as any)),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["chats", "context", vars.project_chat_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["chats", "history", vars.project_chat_id],
      });
    },
  });
};

export const useMoveConversationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      targetProjectId,
    }: {
      conversationId: string;
      targetProjectId: string;
    }) => {
      try {
        await directus.request(
          updateItem("conversation", conversationId, {
            project_id: targetProjectId,
          }),
        );
      } catch (error) {
        toast.error("Failed to move conversation.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Conversation moved successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to move conversation: " + error.message);
    },
  });
};

export const useLatestProjectReport = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "report"],
    queryFn: async () => {
      const reports = await directus.request(
        readItems("project_report", {
          filter: {
            project_id: {
              _eq: projectId,
            },
          },
          fields: ["*"],
          sort: "-date_created",
          limit: 1,
        }),
      );

      if (reports.length === 0) {
        return null;
      }

      return reports[0];
    },
    refetchInterval: 30000,
  });
};

export const useProjectReportViews = (reportId: number) => {
  return useQuery({
    queryKey: ["reports", reportId, "views"],
    queryFn: async () => {
      const report = await directus.request(
        readItem("project_report", reportId, {
          fields: ["project_id"],
        }),
      );

      const total = await directus.request(
        aggregate("project_report_metric", {
          aggregate: {
            count: "*",
          },
          query: {
            filter: {
              project_report_id: {
                project_id: {
                  _eq: report.project_id,
                },
              },
            },
          },
        }),
      );

      const recent = await directus.request(
        aggregate("project_report_metric", {
          aggregate: {
            count: "*",
          },
          query: {
            filter: {
              project_report_id: {},
              // in the last 10 mins
              date_created: {
                // @ts-ignore
                _gte: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              },
            },
          },
        }),
      );

      return {
        total: total[0].count,
        recent: recent[0].count,
      };
    },
    refetchInterval: 30000,
  });
};

export const useProjectReport = (reportId: number) => {
  return useQuery({
    queryKey: ["reports", reportId],
    queryFn: () => directus.request(readItem("project_report", reportId)),
    refetchInterval: 30000,
  });
};

// always give the project_id in payload used for invalidation
export const useUpdateProjectReportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      payload,
    }: {
      reportId: number;
      payload: Partial<ProjectReport>;
    }) => directus.request(updateItem("project_report", reportId, payload)),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", vars.payload.project_id, "report"],
      });
      queryClient.invalidateQueries({
        queryKey: ["reports"],
      });
    },
  });
};

export const useCreateProjectReportMetricOncePerDayMutation = () => {
  return useMutation({
    mutationFn: ({ payload }: { payload: Partial<ProjectReportMetric> }) => {
      const key = `rm_${payload.project_report_id}_updated`;
      let shouldUpdate = false;

      try {
        const lastUpdated = localStorage.getItem(key);
        if (!lastUpdated) {
          shouldUpdate = true;
        } else {
          const lastUpdateTime = new Date(lastUpdated).getTime();
          const currentTime = new Date().getTime();
          const hoursDiff = (currentTime - lastUpdateTime) / (1000 * 60 * 60);
          shouldUpdate = hoursDiff >= 24;
        }

        if (shouldUpdate) {
          localStorage.setItem(key, new Date().toISOString());
        }
      } catch (e) {
        // Ignore localStorage errors
        shouldUpdate = true;
      }

      if (!shouldUpdate) {
        return Promise.resolve(null);
      }

      return directus.request(
        createItem("project_report_metric", payload as any),
      );
    },
  });
};

export const useCreateProjectReportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProjectReport,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", vars.projectId, "report"],
      });
      queryClient.invalidateQueries({
        queryKey: ["reports"],
      });
    },
  });
};

export const useDoesProjectReportNeedUpdate = (projectReportId: number) => {
  return useQuery({
    queryKey: ["reports", projectReportId, "needsUpdate"],
    queryFn: async () => {
      const reports = await directus.request(
        readItems("project_report", {
          filter: {
            id: {
              _eq: projectReportId,
            },
            status: {
              _eq: "published",
            },
          },
          fields: ["id", "date_created", "project_id"],
          sort: "-date_created",
          limit: 1,
        }),
      );

      if (reports.length === 0) {
        return false;
      }

      const latestReport = reports[0];

      const latestConversation = await directus.request(
        readItems("conversation", {
          filter: {
            project_id: {
              _eq: latestReport.project_id,
            },
          },
          fields: ["id", "created_at"],
          sort: "-created_at",
          limit: 1,
        }),
      );

      if (latestConversation.length === 0) {
        return false;
      }

      return (
        new Date(latestConversation[0].created_at!) >
        new Date(latestReport.date_created!)
      );
    },
  });
};

// always give the project_report_id in payload used for invalidation
export const usePostProjectReportMetricMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      reportId: number;
      payload: Partial<ProjectReportMetric>;
    }) => directus.request(createItem("project_report_metric", payload as any)),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", vars.payload.project_report_id, "report"],
      });
      queryClient.invalidateQueries({
        queryKey: ["reports", vars.reportId],
      });
    },
  });
};

/**
 * Gathers data needed to build a timeline chart of:
 * 1) Project creation (vertical reference line).
 * 2) This specific project report creation (vertical reference line).
 * 3) Green "stem" lines representing Conversations created (height = number of conversation chunks). Uses Directus aggregate() to get counts.
 * 4) Blue line points representing Project Report Metrics associated with the given project_report_id (e.g., "views", "score", etc.).
 *
 * Based on Mantine Charts docs: https://mantine.dev/charts/line-chart/#reference-lines
 *
 * NOTES:
 * - Make sure you match your date fields in Directus (e.g., "date_created" vs. "created_at").
 * - For any chart "stems", you typically create two data points with the same X but different Y values.
 */
export const useProjectReportTimelineData = (projectReportId: string) => {
  return useQuery({
    queryKey: ["reports", projectReportId, "timelineData"],
    queryFn: async () => {
      // 1. Fetch the project report so we know the projectId and the report's creation date
      const projectReport = await directus.request<ProjectReport>(
        readItem("project_report", projectReportId, {
          fields: ["id", "date_created", "project_id"],
        }),
      );

      if (!projectReport?.project_id) {
        throw new Error("No project_id found on this report");
      }

      const allProjectReports = await directus.request(
        readItems("project_report", {
          filter: {
            project_id: {
              _eq: projectReport.project_id,
            },
          },
          limit: 1000,
          sort: "date_created",
        }),
      );

      // 2. Fetch the project to get the creation date
      //    Adjust fields to match your date field naming
      const project = await directus.request<Project>(
        readItem("project", projectReport.project_id.toString(), {
          fields: ["id", "created_at"], // or ["id", "created_at"]
        }),
      );

      // 3. Fetch all Conversations and use an aggregate to count conversation_chunks
      const conversations = await directus.request<Conversation[]>(
        readItems("conversation", {
          fields: ["id", "created_at"], // or ["id", "date_created"]
          filter: {
            project_id: {
              _eq: projectReport.project_id,
            },
          },
          limit: 1000, // adjust to your needs
        }),
      );

      // Aggregate chunk counts per conversation with Directus aggregator
      let conversationChunkAgg: { conversation_id: string; count: number }[] =
        [];
      if (conversations.length > 0) {
        const conversationIds = conversations.map((c) => c.id);
        const chunkCountsAgg = await directus.request<
          Array<{ conversation_id: string; count: number }>
        >(
          readItems("conversation_chunk", {
            aggregate: { count: "*" },
            groupBy: ["conversation_id"],
            filter: { conversation_id: { _in: conversationIds } },
          }),
        );

        // chunkCountsAgg shape is [{ conversation_id: '...', count: 5 }, ...]
        conversationChunkAgg = chunkCountsAgg;
      }

      // 4. Fetch all Project Report Metrics for this project_report_id
      //    (e.g., type "view", "score," etc. – adapt as needed)
      const projectReportMetrics = await directus.request<
        ProjectReportMetric[]
      >(
        readItems("project_report_metric", {
          fields: ["id", "date_created", "project_report_id"],
          filter: {
            project_report_id: {
              project_id: {
                _eq: project.id,
              },
            },
          },
          sort: "date_created",
          limit: 1000,
        }),
      );

      // Return all structured data. The consuming component can then create the chart data arrays.
      return {
        projectCreatedAt: project.created_at,
        reportCreatedAt: projectReport.date_created,
        allReports: allProjectReports.map((r) => ({
          id: r.id,
          createdAt: r.date_created,
        })),
        conversations: conversations,
        conversationChunks: conversations.map((conv) => {
          const aggRow = conversationChunkAgg.find(
            (row) => row.conversation_id === conv.id,
          );
          return {
            conversationId: conv.id,
            createdAt: conv.created_at,
            chunkCount: aggRow?.count ?? 0,
          };
        }),
        projectReportMetrics,
      };
    },
  });
};
