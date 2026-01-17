import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1768635384993 implements MigrationInterface {
  name = 'Migration1768635384993';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "previousValue" jsonb`,
    );
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "newValue" jsonb`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "recordId" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "recordId"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "newValue"`);
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP COLUMN "previousValue"`,
    );
  }
}
