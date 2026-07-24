CREATE TYPE "public"."TechnologyCategory" AS ENUM('LANGUAGE', 'FRAMEWORK', 'DATABASE', 'INFRA', 'TOOL', 'OTHER');--> statement-breakpoint
CREATE TABLE "technology" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" "TechnologyCategory" DEFAULT 'OTHER' NOT NULL,
	"iconSlug" varchar(100),
	"position" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "IDX_technology_position" ON "technology" USING btree ("position");