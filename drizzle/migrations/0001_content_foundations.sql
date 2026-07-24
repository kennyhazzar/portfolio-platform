CREATE TYPE "public"."ContentStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."Locale" AS ENUM('ru', 'en');--> statement-breakpoint
ALTER TYPE "public"."Subjects" ADD VALUE 'Hero';--> statement-breakpoint
ALTER TYPE "public"."Subjects" ADD VALUE 'About';--> statement-breakpoint
ALTER TYPE "public"."Subjects" ADD VALUE 'SiteSetting';--> statement-breakpoint
ALTER TYPE "public"."Subjects" ADD VALUE 'Contact';--> statement-breakpoint
ALTER TYPE "public"."Subjects" ADD VALUE 'Technology';--> statement-breakpoint
ALTER TYPE "public"."Subjects" ADD VALUE 'Navigation';--> statement-breakpoint
ALTER TYPE "public"."Subjects" ADD VALUE 'Case';--> statement-breakpoint
ALTER TYPE "public"."Subjects" ADD VALUE 'Post';--> statement-breakpoint
ALTER TYPE "public"."Subjects" ADD VALUE 'Comment';--> statement-breakpoint
ALTER TABLE "file" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "file" ADD COLUMN "isCover" boolean DEFAULT false NOT NULL;