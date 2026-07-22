import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostsUserId20260723090000 implements MigrationInterface {
  name = 'PostsUserId20260723090000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Idempotent: dev databases running with DB_SYNC=true may already have this
    // column, so guard both the column and the FK constraint.
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "user_id" UUID`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_user_id'
        ) THEN
          ALTER TABLE "posts"
            ADD CONSTRAINT "fk_posts_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "fk_posts_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN IF EXISTS "user_id"`,
    );
  }
}
