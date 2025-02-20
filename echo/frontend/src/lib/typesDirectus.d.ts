type Account = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  status: string;
  users: any[] | AccountDirectusUsers[];
};

type AccountDirectusUsers = {
  account_id?: string | Account | null;
  directus_users_id?: string | DirectusUsers | null;
  id: number;
};

type Aspect = {
  centroid_embedding?: string | null;
  created_at?: string | null;
  description?: string | null;
  id: string;
  image_url?: string | null;
  long_summary?: string | null;
  name?: string | null;
  quotes: any[] | QuoteAspect[];
  representative_quotes: any[] | QuoteAspect1[];
  short_summary?: string | null;
  updated_at?: string | null;
  view_id?: string | View | null;
};

type Conversation = {
  chunks: any[] | ConversationChunk[];
  context?: string | null;
  created_at?: string | null;
  description?: string | null;
  id: string;
  participant_email?: string | null;
  participant_name?: string | null;
  participant_user_agent?: string | null;
  processing_completed_at?: string | null;
  processing_error?: string | null;
  processing_started_at?: string | null;
  processing_status?: string | null;
  project_chat_messages: any[] | ProjectChatMessageConversation[];
  project_chats: any[] | ProjectChatConversation[];
  project_id: string | Project;
  replies: any[] | ConversationReply[];
  summary?: string | null;
  tags: any[] | ConversationProjectTag[];
  title?: string | null;
  updated_at?: string | null;
};

type ConversationChunk = {
  conversation_id: string | Conversation;
  created_at?: string | null;
  id: string;
  path?: string | null;
  quotes: any[] | QuoteConversationChunk[];
  task_id?: string | null;
  timestamp: string;
  transcript?: string | null;
  updated_at?: string | null;
};

type ConversationProjectTag = {
  conversation_id?: string | Conversation | null;
  id: number;
  project_tag_id?: string | ProjectTag | null;
};

type ConversationReply = {
  content_text?: string | null;
  conversation_id?: string | Conversation | null;
  date_created?: string | null;
  id: number;
  type?: string | null;
};

type DirectusAccess = {
  id: string;
  policy: string | DirectusPolicies;
  role?: string | DirectusRoles | null;
  sort?: number | null;
  user?: string | DirectusUsers | null;
};

type DirectusActivity = {
  action: string;
  collection: string;
  id: number;
  ip?: string | null;
  item: string;
  origin?: string | null;
  revisions: any[] | DirectusRevisions[];
  timestamp: string;
  user?: string | DirectusUsers | null;
  user_agent?: string | null;
};

type DirectusCollections = {
  accountability?: string | null;
  archive_app_filter: boolean;
  archive_field?: string | null;
  archive_value?: string | null;
  collapse: string;
  collection: string;
  color?: string | null;
  display_template?: string | null;
  group?: string | DirectusCollections | null;
  hidden: boolean;
  icon?: string | null;
  item_duplication_fields?: unknown | null;
  note?: string | null;
  preview_url?: string | null;
  singleton: boolean;
  sort?: number | null;
  sort_field?: string | null;
  translations?: unknown | null;
  unarchive_value?: string | null;
  versioning: boolean;
};

type DirectusComments = {
  collection: string | DirectusCollections;
  comment: string;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  item: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

type DirectusDashboards = {
  color?: string | null;
  date_created?: string | null;
  icon: string;
  id: string;
  name: string;
  note?: string | null;
  panels: any[] | DirectusPanels[];
  user_created?: string | DirectusUsers | null;
};

type DirectusExtensions = {
  bundle?: string | null;
  enabled: boolean;
  folder: string;
  id: string;
  source: string;
};

type DirectusFields = {
  collection: string | DirectusCollections;
  conditions?: unknown | null;
  display?: string | null;
  display_options?: unknown | null;
  field: string;
  group?: string | DirectusFields | null;
  hidden: boolean;
  id: number;
  interface?: string | null;
  note?: string | null;
  options?: unknown | null;
  readonly: boolean;
  required?: boolean | null;
  sort?: number | null;
  special?: unknown | null;
  translations?: unknown | null;
  validation?: unknown | null;
  validation_message?: string | null;
  width?: string | null;
};

type DirectusFiles = {
  charset?: string | null;
  created_on: string;
  description?: string | null;
  duration?: number | null;
  embed?: string | null;
  filename_disk?: string | null;
  filename_download: string;
  filesize?: number | null;
  focal_point_x?: number | null;
  focal_point_y?: number | null;
  folder?: string | DirectusFolders | null;
  height?: number | null;
  id: string;
  location?: string | null;
  metadata?: unknown | null;
  modified_by?: string | DirectusUsers | null;
  modified_on: string;
  storage: string;
  tags?: unknown | null;
  title?: string | null;
  tus_data?: unknown | null;
  tus_id?: string | null;
  type?: string | null;
  uploaded_by?: string | DirectusUsers | null;
  uploaded_on?: string | null;
  width?: number | null;
};

type DirectusFlows = {
  accountability?: string | null;
  color?: string | null;
  date_created?: string | null;
  description?: string | null;
  icon?: string | null;
  id: string;
  name: string;
  operation?: string | DirectusOperations | null;
  operations: any[] | DirectusOperations[];
  options?: unknown | null;
  status: string;
  trigger?: string | null;
  user_created?: string | DirectusUsers | null;
};

type DirectusFolders = {
  id: string;
  name: string;
  parent?: string | DirectusFolders | null;
};

type DirectusMigrations = {
  name: string;
  timestamp?: string | null;
  version: string;
};

type DirectusNotifications = {
  collection?: string | null;
  id: number;
  item?: string | null;
  message?: string | null;
  recipient: string | DirectusUsers;
  sender?: string | DirectusUsers | null;
  status?: string | null;
  subject: string;
  timestamp?: string | null;
};

type DirectusOperations = {
  date_created?: string | null;
  flow: string | DirectusFlows;
  id: string;
  key: string;
  name?: string | null;
  options?: unknown | null;
  position_x: number;
  position_y: number;
  reject?: string | DirectusOperations | null;
  resolve?: string | DirectusOperations | null;
  type: string;
  user_created?: string | DirectusUsers | null;
};

type DirectusPanels = {
  color?: string | null;
  dashboard: string | DirectusDashboards;
  date_created?: string | null;
  height: number;
  icon?: string | null;
  id: string;
  name?: string | null;
  note?: string | null;
  options?: unknown | null;
  position_x: number;
  position_y: number;
  show_header: boolean;
  type: string;
  user_created?: string | DirectusUsers | null;
  width: number;
};

type DirectusPermissions = {
  action: string;
  collection: string;
  fields?: unknown | null;
  id: number;
  permissions?: unknown | null;
  policy: string | DirectusPolicies;
  presets?: unknown | null;
  validation?: unknown | null;
};

type DirectusPolicies = {
  admin_access: boolean;
  app_access: boolean;
  description?: string | null;
  enforce_tfa: boolean;
  icon: string;
  id: string;
  ip_access?: unknown | null;
  name: string;
  permissions: any[] | DirectusPermissions[];
  roles: any[] | DirectusAccess[];
  users: any[] | DirectusAccess[];
};

type DirectusPresets = {
  bookmark?: string | null;
  collection?: string | null;
  color?: string | null;
  filter?: unknown | null;
  icon?: string | null;
  id: number;
  layout?: string | null;
  layout_options?: unknown | null;
  layout_query?: unknown | null;
  refresh_interval?: number | null;
  role?: string | DirectusRoles | null;
  search?: string | null;
  user?: string | DirectusUsers | null;
};

type DirectusRelations = {
  id: number;
  junction_field?: string | null;
  many_collection: string;
  many_field: string;
  one_allowed_collections?: unknown | null;
  one_collection?: string | null;
  one_collection_field?: string | null;
  one_deselect_action: string;
  one_field?: string | null;
  sort_field?: string | null;
};

type DirectusRevisions = {
  activity: number | DirectusActivity;
  collection: string;
  data?: unknown | null;
  delta?: unknown | null;
  id: number;
  item: string;
  parent?: number | DirectusRevisions | null;
  version?: string | DirectusVersions | null;
};

type DirectusRoles = {
  children: any[] | DirectusRoles[];
  description?: string | null;
  icon: string;
  id: string;
  name: string;
  parent?: string | DirectusRoles | null;
  policies: any[] | DirectusAccess[];
  users: any[] | DirectusUsers[];
  users_group: string;
};

type DirectusSessions = {
  expires: string;
  ip?: string | null;
  next_token?: string | null;
  origin?: string | null;
  share?: string | DirectusShares | null;
  token: string;
  user?: string | DirectusUsers | null;
  user_agent?: string | null;
};

type DirectusSettings = {
  auth_login_attempts?: number | null;
  auth_password_policy?: string | null;
  basemaps?: unknown | null;
  custom_aspect_ratios?: unknown | null;
  custom_css?: string | null;
  default_appearance: string;
  default_language: string;
  default_theme_dark?: string | null;
  default_theme_light?: string | null;
  id: number;
  mapbox_key?: string | null;
  module_bar?: unknown | null;
  project_color: string;
  project_descriptor?: string | null;
  project_logo?: string | DirectusFiles | null;
  project_name: string;
  project_url?: string | null;
  public_background?: string | DirectusFiles | null;
  public_favicon?: string | DirectusFiles | null;
  public_foreground?: string | DirectusFiles | null;
  public_note?: string | null;
  public_registration: boolean;
  public_registration_email_filter?: unknown | null;
  public_registration_role?: string | DirectusRoles | null;
  public_registration_verify_email: boolean;
  report_bug_url?: string | null;
  report_error_url?: string | null;
  report_feature_url?: string | null;
  storage_asset_presets?: unknown | null;
  storage_asset_transform?: string | null;
  storage_default_folder?: string | DirectusFolders | null;
  theme_dark_overrides?: unknown | null;
  theme_light_overrides?: unknown | null;
  theming_group: string;
};

type DirectusShares = {
  collection: string | DirectusCollections;
  date_created?: string | null;
  date_end?: string | null;
  date_start?: string | null;
  id: string;
  item: string;
  max_uses?: number | null;
  name?: string | null;
  password?: string | null;
  role?: string | DirectusRoles | null;
  times_used?: number | null;
  user_created?: string | DirectusUsers | null;
};

type DirectusSyncIdMap = {
  created_at?: string | null;
  id: number;
  local_id: string;
  sync_id: string;
  table: string;
};

type DirectusTranslations = {
  id: string;
  key: string;
  language: string;
  value: string;
};

type DirectusUsers = {
  accounts: any[] | AccountDirectusUsers[];
  appearance?: string | null;
  auth_data?: unknown | null;
  avatar?: string | DirectusFiles | null;
  description?: string | null;
  email?: string | null;
  email_notifications?: boolean | null;
  external_identifier?: string | null;
  first_name?: string | null;
  id: string;
  language?: string | null;
  last_access?: string | null;
  last_name?: string | null;
  last_page?: string | null;
  location?: string | null;
  password?: string | null;
  policies: any[] | DirectusAccess[];
  projects: any[] | Project[];
  provider: string;
  role?: string | DirectusRoles | null;
  status: string;
  tags?: unknown | null;
  tfa_secret?: string | null;
  theme_dark?: string | null;
  theme_dark_overrides?: unknown | null;
  theme_light?: string | null;
  theme_light_overrides?: unknown | null;
  title?: string | null;
  token?: string | null;
};

type DirectusVersions = {
  collection: string | DirectusCollections;
  date_created?: string | null;
  date_updated?: string | null;
  delta?: unknown | null;
  hash?: string | null;
  id: string;
  item: string;
  key: string;
  name?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

type DirectusWebhooks = {
  actions: unknown;
  collections: unknown;
  data: boolean;
  headers?: unknown | null;
  id: number;
  method: string;
  migrated_flow?: string | DirectusFlows | null;
  name: string;
  status: string;
  url: string;
  was_active_before_deprecation: boolean;
};

type Document = {
  context?: string | null;
  created_at?: string | null;
  description?: string | null;
  id: string;
  is_processed: boolean;
  original_filename?: string | null;
  path?: string | null;
  processing_error?: string | null;
  project_id: string | Project;
  title?: string | null;
  type?: string | null;
  updated_at?: string | null;
};

type Insight = {
  created_at?: string | null;
  id: string;
  project_analysis_run_id?: string | ProjectAnalysisRun | null;
  quotes: any[] | Quote[];
  summary?: string | null;
  title?: string | null;
  updated_at?: string | null;
};

type Project = {
  context?: string | null;
  conversation_ask_for_participant_name_label?: string | null;
  conversations: any[] | Conversation[];
  created_at?: string | null;
  default_conversation_ask_for_participant_name?: boolean | null;
  default_conversation_description?: string | null;
  default_conversation_finish_text?: string | null;
  default_conversation_title?: string | null;
  default_conversation_transcript_prompt?: string | null;
  default_conversation_tutorial_slug?: string | null;
  directus_user_id?: string | DirectusUsers | null;
  get_reply_prompt?: string | null;
  id: string;
  image_generation_model?: string | null;
  is_conversation_allowed: boolean;
  is_get_reply_enabled?: boolean | null;
  is_library_insights_enabled?: boolean | null;
  language?: string | null;
  name?: string | null;
  pin?: string | null;
  project_analysis_runs: any[] | ProjectAnalysisRun[];
  project_chats: any[] | ProjectChat[];
  project_reports: any[] | ProjectReport[];
  tags: any[] | ProjectTag[];
  updated_at?: string | null;
};

type ProjectAnalysisRun = {
  created_at?: string | null;
  id: string;
  insights: any[] | Insight[];
  processing_completed_at?: string | null;
  processing_error?: string | null;
  processing_message?: string | null;
  processing_started_at?: string | null;
  processing_status?: string | null;
  project_id?: string | Project | null;
  quotes: any[] | Quote[];
  updated_at?: string | null;
  views: any[] | View[];
};

type ProjectChat = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  name?: string | null;
  project_chat_messages: any[] | ProjectChatMessage[];
  project_id?: string | Project | null;
  used_conversations: any[] | ProjectChatConversation[];
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

type ProjectChatConversation = {
  conversation_id?: string | Conversation | null;
  id: number;
  project_chat_id?: string | ProjectChat | null;
};

type ProjectChatMessage = {
  added_conversations: any[] | ProjectChatMessageConversation1[];
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  message_from?: string | null;
  project_chat_id?: string | ProjectChat | null;
  text?: string | null;
  tokens_count?: number | null;
  used_conversations: any[] | ProjectChatMessageConversation[];
};

type ProjectChatMessageConversation = {
  conversation_id?: string | Conversation | null;
  id: number;
  project_chat_message_id?: string | ProjectChatMessage | null;
};

type ProjectChatMessageConversation1 = {
  conversation_id?: string | Conversation | null;
  id: number;
  project_chat_message_id?: string | ProjectChatMessage | null;
};

type ProjectReport = {
  content?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  error_code?: string | null;
  id: number;
  language?: string | null;
  project_id?: string | Project | null;
  show_portal_link?: boolean | null;
  status: string;
};

type ProjectReportMetric = {
  date_created?: string | null;
  date_updated?: string | null;
  id: number;
  ip?: string | null;
  project_report_id?: number | ProjectReport | null;
  type?: string | null;
};

type ProjectTag = {
  conversations: any[] | ConversationProjectTag[];
  created_at?: string | null;
  id: string;
  project_id: string | Project;
  sort?: number | null;
  text?: string | null;
  updated_at?: string | null;
};

type Quote = {
  aspects: any[] | QuoteAspect[];
  conversation_chunks: any[] | QuoteConversationChunk[];
  conversation_id: string | Conversation;
  created_at?: string | null;
  embedding: string;
  id: string;
  insight_id?: string | Insight | null;
  order?: number | null;
  project_analysis_run_id?: string | ProjectAnalysisRun | null;
  representative_aspects: any[] | QuoteAspect1[];
  text: string;
  timestamp?: string | null;
  updated_at?: string | null;
};

type QuoteAspect = {
  aspect_id?: string | Aspect | null;
  id: number;
  quote_id?: string | Quote | null;
};

type QuoteAspect1 = {
  aspect_id?: string | Aspect | null;
  id: number;
  quote_id?: string | Quote | null;
};

type QuoteConversationChunk = {
  conversation_chunk_id?: string | ConversationChunk | null;
  id: number;
  quote_id?: string | Quote | null;
};

type View = {
  aspects: any[] | Aspect[];
  created_at?: string | null;
  id: string;
  name?: string | null;
  processing_completed_at?: string | null;
  processing_error?: string | null;
  processing_message?: string | null;
  processing_started_at?: string | null;
  processing_status?: string | null;
  project_analysis_run_id?: string | ProjectAnalysisRun | null;
  summary?: string | null;
  updated_at?: string | null;
};

type CustomDirectusTypes = {
  account: Account[];
  account_directus_users: AccountDirectusUsers[];
  aspect: Aspect[];
  conversation: Conversation[];
  conversation_chunk: ConversationChunk[];
  conversation_project_tag: ConversationProjectTag[];
  conversation_reply: ConversationReply[];
  directus_access: DirectusAccess[];
  directus_activity: DirectusActivity[];
  directus_collections: DirectusCollections[];
  directus_comments: DirectusComments[];
  directus_dashboards: DirectusDashboards[];
  directus_extensions: DirectusExtensions[];
  directus_fields: DirectusFields[];
  directus_files: DirectusFiles[];
  directus_flows: DirectusFlows[];
  directus_folders: DirectusFolders[];
  directus_migrations: DirectusMigrations[];
  directus_notifications: DirectusNotifications[];
  directus_operations: DirectusOperations[];
  directus_panels: DirectusPanels[];
  directus_permissions: DirectusPermissions[];
  directus_policies: DirectusPolicies[];
  directus_presets: DirectusPresets[];
  directus_relations: DirectusRelations[];
  directus_revisions: DirectusRevisions[];
  directus_roles: DirectusRoles[];
  directus_sessions: DirectusSessions[];
  directus_settings: DirectusSettings;
  directus_shares: DirectusShares[];
  directus_sync_id_map: DirectusSyncIdMap[];
  directus_translations: DirectusTranslations[];
  directus_users: DirectusUsers[];
  directus_versions: DirectusVersions[];
  directus_webhooks: DirectusWebhooks[];
  document: Document[];
  insight: Insight[];
  project: Project[];
  project_analysis_run: ProjectAnalysisRun[];
  project_chat: ProjectChat[];
  project_chat_conversation: ProjectChatConversation[];
  project_chat_message: ProjectChatMessage[];
  project_chat_message_conversation: ProjectChatMessageConversation[];
  project_chat_message_conversation_1: ProjectChatMessageConversation1[];
  project_report: ProjectReport[];
  project_report_metric: ProjectReportMetric[];
  project_tag: ProjectTag[];
  quote: Quote[];
  quote_aspect: QuoteAspect[];
  quote_aspect_1: QuoteAspect1[];
  quote_conversation_chunk: QuoteConversationChunk[];
  view: View[];
};
