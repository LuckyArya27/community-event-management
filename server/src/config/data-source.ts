import path from 'path';
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT!),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [path.join(__dirname, '../entities/*.entity.{ts,js}')],
  synchronize: true,
});

async function initializeDataSource() {
  try {
    await AppDataSource.initialize();
    console.log('Postgres Connected...');
  } catch (error) {
    console.error('Postgres Error:', error);
  }
}


export { AppDataSource, initializeDataSource };
