import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1768376274902 implements MigrationInterface {
  name = 'Migration1768376274902';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9bc050eb2c77e448471cafbc6f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resources" DROP CONSTRAINT "UQ_9bc050eb2c77e448471cafbc6f3"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "resources" ADD CONSTRAINT "UQ_9bc050eb2c77e448471cafbc6f3" UNIQUE ("slug")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9bc050eb2c77e448471cafbc6f" ON "resources" ("slug") `,
    );
  }
}
