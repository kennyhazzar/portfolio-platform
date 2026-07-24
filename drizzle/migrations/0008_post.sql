CREATE TABLE "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authorUserId" uuid NOT NULL,
	"status" "ContentStatus" DEFAULT 'DRAFT' NOT NULL,
	"publishedAt" timestamp with time zone,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "post_translation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"locale" "Locale" NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"seoTitle" varchar(255),
	"seoDescription" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_authorUserId_user_id_fk" FOREIGN KEY ("authorUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_translation" ADD CONSTRAINT "post_translation_postId_post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "U_post_translation_post_locale" ON "post_translation" USING btree ("postId","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "U_post_translation_locale_slug" ON "post_translation" USING btree ("locale","slug");