CREATE TABLE "site_setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_setting_translation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"siteSettingId" uuid NOT NULL,
	"locale" "Locale" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"footerText" text,
	"copyrightText" varchar(255),
	"defaultSeoTitle" varchar(255),
	"defaultSeoDescription" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "site_setting_translation" ADD CONSTRAINT "site_setting_translation_siteSettingId_site_setting_id_fk" FOREIGN KEY ("siteSettingId") REFERENCES "public"."site_setting"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "U_site_setting_translation_locale" ON "site_setting_translation" USING btree ("siteSettingId","locale");