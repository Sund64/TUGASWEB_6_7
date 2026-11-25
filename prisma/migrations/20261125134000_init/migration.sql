CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

CREATE TABLE "app_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_sessions" (
    "token_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_sessions_pkey" PRIMARY KEY ("token_hash")
);

CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "original_amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "exchange_rate" DECIMAL(20,10) NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_users_username_key" ON "app_users"("username");
CREATE INDEX "app_sessions_user_id_idx" ON "app_sessions"("user_id");
CREATE INDEX "transactions_user_date_idx" ON "transactions"("user_id", "date", "created_at");

ALTER TABLE "app_sessions"
    ADD CONSTRAINT "app_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "app_users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transactions"
    ADD CONSTRAINT "transactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "app_users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
