CREATE TYPE "public"."status" AS ENUM('reviewPending', 'uploadPending');--> statement-breakpoint
CREATE TYPE "public"."userType" AS ENUM('youtuber', 'editor');--> statement-breakpoint
CREATE TYPE "public"."videoType" AS ENUM('public', 'private', 'unlisted');--> statement-breakpoint
CREATE TABLE "ws-editor-join" (
	"workspace" varchar,
	"editor" uuid,
	"authorize" boolean,
	CONSTRAINT "pk-ws-editor-join" PRIMARY KEY("editor","workspace")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"userType" "userType" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"desc" varchar,
	"videoType" "videoType" NOT NULL,
	"thumbnail" varchar,
	"fileId" varchar NOT NULL,
	"duration" varchar NOT NULL,
	"isMadeForKids" boolean NOT NULL,
	"status" "status" NOT NULL,
	"willUploadAt" varchar,
	"editor" uuid NOT NULL,
	"workspace" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ws-video-editor-join" (
	"videoId" varchar,
	"editor" uuid,
	"workspace" varchar,
	CONSTRAINT "pk-ws-video-editor-join" PRIMARY KEY("videoId","workspace","editor")
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" varchar PRIMARY KEY NOT NULL,
	"userHandle" varchar NOT NULL,
	"owner" uuid,
	"email" varchar NOT NULL,
	"refreshToken" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ws-editor-join" ADD CONSTRAINT "ws-editor-join_workspace_workspace_id_fk" FOREIGN KEY ("workspace") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ws-editor-join" ADD CONSTRAINT "ws-editor-join_editor_user_id_fk" FOREIGN KEY ("editor") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_editor_user_id_fk" FOREIGN KEY ("editor") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_workspace_workspace_id_fk" FOREIGN KEY ("workspace") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ws-video-editor-join" ADD CONSTRAINT "ws-video-editor-join_editor_user_id_fk" FOREIGN KEY ("editor") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ws-video-editor-join" ADD CONSTRAINT "ws-video-editor-join_workspace_workspace_id_fk" FOREIGN KEY ("workspace") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_owner_user_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;