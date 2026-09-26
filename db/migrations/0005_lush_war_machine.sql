CREATE TABLE "anonymous_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'unread' NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anonymous_messages_status_check" CHECK ("anonymous_messages"."status" in ('unread', 'read'))
);
--> statement-breakpoint
ALTER TABLE "anonymous_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "anonymous_messages_status_idx" ON "anonymous_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "anonymous_messages_created_at_idx" ON "anonymous_messages" USING btree ("created_at");