CREATE TABLE "hero" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ctaUrl" varchar(500),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hero_translation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"heroId" uuid NOT NULL,
	"locale" "Locale" NOT NULL,
	"name" varchar(255) NOT NULL,
	"headline" varchar(500),
	"description" text,
	"ctaLabel" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "hero_translation" ADD CONSTRAINT "hero_translation_heroId_hero_id_fk" FOREIGN KEY ("heroId") REFERENCES "public"."hero"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "U_hero_translation_hero_locale" ON "hero_translation" USING btree ("heroId","locale");