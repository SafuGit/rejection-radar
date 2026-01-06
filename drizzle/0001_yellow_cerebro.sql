CREATE TABLE "otp" (
	"id" serial PRIMARY KEY NOT NULL,
	"otp" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_in" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "otp" ADD CONSTRAINT "otp_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;