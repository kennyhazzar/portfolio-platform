ALTER TABLE "comment" ALTER COLUMN "postId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "caseId" uuid;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_caseId_case_id_fk" FOREIGN KEY ("caseId") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_comment_caseId" ON "comment" USING btree ("caseId");--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "CHK_comment_exactly_one_target" CHECK ((("postId" IS NOT NULL)::int + ("caseId" IS NOT NULL)::int) = 1);
