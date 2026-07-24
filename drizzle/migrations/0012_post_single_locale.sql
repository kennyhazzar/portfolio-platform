ALTER TABLE "post_translation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "post_translation" CASCADE;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "locale" "Locale" NOT NULL;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "title" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "excerpt" text NOT NULL;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "body" text NOT NULL;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "seoTitle" varchar(255);--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "seoDescription" varchar(500);--> statement-breakpoint
CREATE UNIQUE INDEX "U_post_locale_slug" ON "post" USING btree ("locale","slug");