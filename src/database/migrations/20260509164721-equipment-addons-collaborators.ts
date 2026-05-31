import { MigrationInterface, QueryRunner } from 'typeorm';

export class EquipmentAddonsCollaborators20260509164721 implements MigrationInterface {
  name = 'EquipmentAddonsCollaborators20260509164721';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "public"."equipment_category_enum" AS ENUM(
        'CAMERA_BODY','LENS','DRONE','GIMBAL','LIGHTING','AUDIO','PHOTOBOOTH','OTHER'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."addon_category_enum" AS ENUM(
        'CAMERA','DRONE','GIMBAL','LIGHTING','ALBUM','HOUR','OTHER'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."collaborator_status_enum" AS ENUM(
        'INVITED','ACCEPTED','REJECTED','CANCELLED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."custom_request_status_enum" AS ENUM(
        'PENDING','QUOTED','ACCEPTED','REJECTED'
      )
    `);

    // ── vendor_equipment ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "vendor_equipment" (
        "id"           UUID NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at"   TIMESTAMPTZ,
        "vendor_id"    UUID NOT NULL,
        "name"         VARCHAR NOT NULL,
        "brand"        VARCHAR,
        "model"        VARCHAR,
        "category"     "public"."equipment_category_enum" NOT NULL DEFAULT 'OTHER',
        "quantity"     INTEGER NOT NULL DEFAULT 1,
        "notes"        TEXT,
        "is_available" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "PK_vendor_equipment" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vendor_equipment_vendor"
          FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_vendor_equipment_vendor_id" ON "vendor_equipment" ("vendor_id")`);

    // ── service_addons ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "service_addons" (
        "id"           UUID NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at"   TIMESTAMPTZ,
        "vendor_id"    UUID NOT NULL,
        "name"         VARCHAR NOT NULL,
        "description"  TEXT,
        "category"     "public"."addon_category_enum" NOT NULL DEFAULT 'OTHER',
        "price"        NUMERIC(10,2) NOT NULL,
        "max_quantity" INTEGER NOT NULL DEFAULT 1,
        "is_active"    BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "PK_service_addons" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_addons_vendor"
          FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_service_addons_vendor_id" ON "service_addons" ("vendor_id")`);

    // ── booking_addons ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "booking_addons" (
        "id"             UUID NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at"     TIMESTAMPTZ,
        "booking_id"     UUID NOT NULL,
        "addon_id"       UUID NOT NULL,
        "quantity"       INTEGER NOT NULL DEFAULT 1,
        "price_snapshot" NUMERIC(10,2) NOT NULL,
        CONSTRAINT "PK_booking_addons" PRIMARY KEY ("id"),
        CONSTRAINT "FK_booking_addons_booking"
          FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_booking_addons_addon"
          FOREIGN KEY ("addon_id") REFERENCES "service_addons"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_booking_addons_booking_id" ON "booking_addons" ("booking_id")`);

    // ── booking_custom_requests ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "booking_custom_requests" (
        "id"              UUID NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at"      TIMESTAMPTZ,
        "booking_id"      UUID NOT NULL,
        "description"     TEXT NOT NULL,
        "vendor_response" TEXT,
        "quoted_price"    NUMERIC(10,2),
        "status"          "public"."custom_request_status_enum" NOT NULL DEFAULT 'PENDING',
        CONSTRAINT "PK_booking_custom_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_booking_custom_requests_booking"
          FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_booking_custom_requests_booking_id" ON "booking_custom_requests" ("booking_id")`);

    // ── booking_collaborators ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "booking_collaborators" (
        "id"                     UUID NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"             TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"             TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at"             TIMESTAMPTZ,
        "booking_id"             UUID NOT NULL,
        "primary_vendor_id"      UUID NOT NULL,
        "collaborator_vendor_id" UUID NOT NULL,
        "role"                   VARCHAR NOT NULL,
        "notes"                  TEXT,
        "agreed_fee"             NUMERIC(10,2) NOT NULL DEFAULT 0,
        "status"                 "public"."collaborator_status_enum" NOT NULL DEFAULT 'INVITED',
        "responded_at"           TIMESTAMPTZ,
        CONSTRAINT "PK_booking_collaborators" PRIMARY KEY ("id"),
        CONSTRAINT "FK_booking_collaborators_booking"
          FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_booking_collaborators_primary_vendor"
          FOREIGN KEY ("primary_vendor_id") REFERENCES "vendors"("id"),
        CONSTRAINT "FK_booking_collaborators_collaborator_vendor"
          FOREIGN KEY ("collaborator_vendor_id") REFERENCES "vendors"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_booking_collaborators_booking_id" ON "booking_collaborators" ("booking_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "booking_collaborators"`);
    await queryRunner.query(`DROP TABLE "booking_custom_requests"`);
    await queryRunner.query(`DROP TABLE "booking_addons"`);
    await queryRunner.query(`DROP TABLE "service_addons"`);
    await queryRunner.query(`DROP TABLE "vendor_equipment"`);
    await queryRunner.query(`DROP TYPE "public"."custom_request_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."collaborator_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."addon_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."equipment_category_enum"`);
  }
}
