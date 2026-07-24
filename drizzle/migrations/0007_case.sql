CREATE TABLE "case" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "ContentStatus" DEFAULT 'DRAFT' NOT NULL,
	"publishedAt" timestamp with time zone,
	"position" integer DEFAULT 0 NOT NULL,
	"repoUrl" varchar(500),
	"liveUrl" varchar(500),
	"viewCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "case_technology" (
	"caseId" uuid NOT NULL,
	"technologyId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_translation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caseId" uuid NOT NULL,
	"locale" "Locale" NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"seoTitle" varchar(255),
	"seoDescription" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "case_technology" ADD CONSTRAINT "case_technology_caseId_case_id_fk" FOREIGN KEY ("caseId") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_technology" ADD CONSTRAINT "case_technology_technologyId_technology_id_fk" FOREIGN KEY ("technologyId") REFERENCES "public"."technology"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_translation" ADD CONSTRAINT "case_translation_caseId_case_id_fk" FOREIGN KEY ("caseId") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "U_case_technology" ON "case_technology" USING btree ("caseId","technologyId");--> statement-breakpoint
CREATE UNIQUE INDEX "U_case_translation_case_locale" ON "case_translation" USING btree ("caseId","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "U_case_translation_locale_slug" ON "case_translation" USING btree ("locale","slug");