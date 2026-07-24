CREATE TYPE "public"."ContactPlatform" AS ENUM('GITHUB', 'TELEGRAM', 'HABR_CAREER', 'EMAIL', 'LINKEDIN', 'OTHER');--> statement-breakpoint
CREATE TABLE "contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "ContactPlatform" NOT NULL,
	"value" varchar(255) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "IDX_contact_position" ON "contact" USING btree ("position");