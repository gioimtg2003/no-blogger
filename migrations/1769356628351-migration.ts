import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1769356628351 implements MigrationInterface {
  name = 'Migration1769356628351';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "teams" ADD "customDomain" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" ADD CONSTRAINT "UQ_5edd8231b1b335ac9c7a8dae660" UNIQUE ("customDomain")`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teams_domainstatus_enum" AS ENUM('PENDING', 'ACTIVE', 'ERROR', 'CONFIG_NEEDED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" ADD "domainStatus" "public"."teams_domainstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" ADD "cloudflareId" character varying(255)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5edd8231b1b335ac9c7a8dae66" ON "teams" ("customDomain") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5edd8231b1b335ac9c7a8dae66"`,
    );
    await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "cloudflareId"`);
    await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "domainStatus"`);
    await queryRunner.query(`DROP TYPE "public"."teams_domainstatus_enum"`);
    await queryRunner.query(
      `ALTER TABLE "teams" DROP CONSTRAINT "UQ_5edd8231b1b335ac9c7a8dae660"`,
    );
    await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "customDomain"`);
  }
}
