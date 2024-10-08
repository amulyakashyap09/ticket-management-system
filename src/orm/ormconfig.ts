const dotenv = require('dotenv');
dotenv.config();
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { User } from './entities/User';
import { Ticket } from './entities/Ticket';
import { CreateUsers1681234567890 } from './migrations/1681234567890-CreateUsers';
import { CreateTicketsTable1681234567890 } from './migrations/1681234567890-CreateTickets';

const AppDataSource = new DataSource({
  type: 'postgres',
  name: 'default',
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  logging: false,
  entities: [User, Ticket],
  migrations: [CreateUsers1681234567890, CreateTicketsTable1681234567890],
  namingStrategy: new SnakeNamingStrategy(),
});

export = AppDataSource;
