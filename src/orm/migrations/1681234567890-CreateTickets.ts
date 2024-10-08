import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTicketsTable1681234567890 implements MigrationInterface {
  name = 'CreateTicketsTable1681234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the tickets table with raw SQL
    await queryRunner.query(`
            CREATE TABLE tickets (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description VARCHAR(255),
                type VARCHAR(255) NOT NULL,
                venue VARCHAR(255) NOT NULL,
                status VARCHAR(255) NOT NULL,
                price NUMERIC DEFAULT 0,
                priority VARCHAR(255) NOT NULL,
                due_date TIMESTAMP NOT NULL,
                created_by INT NOT NULL,
                assigneduser INT[] DEFAULT '{}'
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the tickets table
    await queryRunner.query(`
            DROP TABLE tickets;
        `);
  }
}
