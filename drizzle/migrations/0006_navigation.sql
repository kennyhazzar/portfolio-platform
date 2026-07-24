CREATE TABLE "navigation_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parentId" uuid,
	"url" varchar(500) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigation_item_translation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"navigationItemId" uuid NOT NULL,
	"locale" "Locale" NOT NULL,
	"label" varchar(100) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "navigation_item" ADD CONSTRAINT "navigation_item_parentId_navigation_item_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."navigation_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigation_item_translation" ADD CONSTRAINT "navigation_item_translation_navigationItemId_navigation_item_id_fk" FOREIGN KEY ("navigationItemId") REFERENCES "public"."navigation_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "U_navigation_item_translation_item_locale" ON "navigation_item_translation" USING btree ("navigationItemId","locale");