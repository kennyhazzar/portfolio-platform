CREATE TABLE "about" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "about_translation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aboutId" uuid NOT NULL,
	"locale" "Locale" NOT NULL,
	"bio" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "about_translation" ADD CONSTRAINT "about_translation_aboutId_about_id_fk" FOREIGN KEY ("aboutId") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "U_about_translation_about_locale" ON "about_translation" USING btree ("aboutId","locale");