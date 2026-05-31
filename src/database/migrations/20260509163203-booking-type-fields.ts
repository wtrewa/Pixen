import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingTypeFields20260509163203 implements MigrationInterface {
  name = 'BookingTypeFields20260509163203';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── booking_type enum ────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TYPE "public"."booking_type_enum" AS ENUM('HOURLY', 'MULTI_DATE', 'DATE_RANGE')`,
    );

    // ── vendor_services: booking type + limits ───────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "vendor_services"
        ADD COLUMN "booking_type" "public"."booking_type_enum" NOT NULL DEFAULT 'HOURLY',
        ADD COLUMN "min_hours"    NUMERIC(4,1),
        ADD COLUMN "max_hours"    NUMERIC(4,1),
        ADD COLUMN "max_dates"    INTEGER,
        ADD COLUMN "max_days"     INTEGER`,
    );

    // ── bookings: booking type + per-type date fields ────────────────────────
    await queryRunner.query(
      `ALTER TABLE "bookings"
        ADD COLUMN "booking_type"   "public"."booking_type_enum" NOT NULL DEFAULT 'HOURLY',
        ADD COLUMN "duration_hours" NUMERIC(4,1),
        ADD COLUMN "event_dates"    JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN "end_date"       TIMESTAMPTZ`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings"
        DROP COLUMN "end_date",
        DROP COLUMN "event_dates",
        DROP COLUMN "duration_hours",
        DROP COLUMN "booking_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_services"
        DROP COLUMN "max_days",
        DROP COLUMN "max_dates",
        DROP COLUMN "max_hours",
        DROP COLUMN "min_hours",
        DROP COLUMN "booking_type"`,
    );
    await queryRunner.query(`DROP TYPE "public"."booking_type_enum"`);
  }
}
