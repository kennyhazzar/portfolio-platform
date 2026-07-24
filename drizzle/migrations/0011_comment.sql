CREATE TYPE "public"."CommentStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'SPAM');--> statement-breakpoint
CREATE TABLE "comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"parentCommentId" uuid,
	"authorName" varchar(100) NOT NULL,
	"authorEmail" varchar(255),
	"authorUrl" varchar(500),
	"body" text NOT NULL,
	"status" "CommentStatus" DEFAULT 'PENDING' NOT NULL,
	"locale" "Locale" NOT NULL,
	"ipAddressHash" varchar(64),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_postId_post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parentCommentId_comment_id_fk" FOREIGN KEY ("parentCommentId") REFERENCES "public"."comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_comment_postId" ON "comment" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "IDX_comment_status" ON "comment" USING btree ("status");