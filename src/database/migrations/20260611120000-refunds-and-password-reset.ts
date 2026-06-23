import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefundsAndPasswordReset20260611120000 implements MigrationInterface {
  name = 'RefundsAndPasswordReset20260611120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── payments: refund tracking ────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "payments"
        ADD COLUMN "refund_id"     VARCHAR,
        ADD COLUMN "refund_reason" VARCHAR,
        ADD COLUMN "refunded_at"   TIMESTAMPTZ`,
    );

    // ── users: password reset ────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "users"
        ADD COLUMN "password_reset_token"   VARCHAR,
        ADD COLUMN "password_reset_expires" TIMESTAMPTZ`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users"
        DROP COLUMN "password_reset_expires",
        DROP COLUMN "password_reset_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments"
        DROP COLUMN "refunded_at",
        DROP COLUMN "refund_reason",
        DROP COLUMN "refund_id"`,
    );
  }
}
