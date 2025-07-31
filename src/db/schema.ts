import {
  pgTable,
  varchar,
  uuid,
  pgEnum,
  timestamp,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";

// User Details
export const userTypeEnum = pgEnum("userType", ["youtuber", "editor"]);

export const UserTable = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  password: varchar("password").notNull(),
  role: userTypeEnum("role").notNull(),
});

// Channel Details
export const WorkspaceTable = pgTable("workspace", {
  id: varchar("id").notNull().primaryKey(),
  userHandle: varchar("userHandle").notNull(),
  owner: uuid("owner").references(() => UserTable.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  refreshToken: varchar("refreshToken").notNull(),
});

// Many-to-Many Workspace & Editor
export const EditorWorkspaceJoinTable = pgTable(
  "ws-editor-join",
  {
    workspace: varchar("workspace").references(() => WorkspaceTable.id, {
      onDelete: "cascade",
    }),
    editor: uuid("editor").references(() => UserTable.id, {
      onDelete: "cascade",
    }),
    authorize: boolean("authorize").$default(() => false),
  },
  (table) => [
    primaryKey({
      name: "pk-ws-editor-join",
      columns: [table.editor, table.workspace],
    }),
  ]
);

// Just store video information until it uploads - Once video is uploaded delete perticular entity
export const videoTypeEnum = pgEnum("videoType", [
  "public",
  "private",
  "unlisted",
]);
export const statusEnum = pgEnum("status", ["reviewPending", "uploadPending"]);
export const VideoTable = pgTable("video", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  desc: varchar("desc"),
  videoType: videoTypeEnum("videoType").notNull(),
  thumbnail: varchar("thumbnail"),
  fileId: varchar("fileId").notNull(),
  duration: varchar("duration").notNull(),
  isMadeForKids: boolean("isMadeForKids").notNull(),
  status: statusEnum("status").notNull(),
  willUploadAt: varchar("willUploadAt"),
  editor: uuid("editor")
    .references(() => UserTable.id)
    .notNull(), // This field going to VideoWorkspaceJoinTable
  workspace: varchar("workspace")
    .references(() => WorkspaceTable.id)
    .notNull(), // This field going to VideoWorkspaceJoinTable
});

// Many-to-Many Workspace & Video
export const VideoWorkspaceJoinTable = pgTable(
  "ws-video-editor-join",
  {
    videoId: varchar("videoId"),
    editor: uuid("editor").references(() => UserTable.id),
    workspace: varchar("workspace").references(() => WorkspaceTable.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    primaryKey({
      name: "pk-ws-video-editor-join",
      columns: [table.videoId, table.workspace, table.editor],
    }),
  ]
);
