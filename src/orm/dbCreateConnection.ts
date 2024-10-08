import { DataSource } from 'typeorm';
import AppDataSource from './ormconfig';

export const initializeDataSource = async (): Promise<DataSource> => {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log('Data Source has been initialized!');
    } catch (error) {
      console.error('Error during Data Source initialization', error);
      throw error; // rethrow error if needed
    }
  }
  return AppDataSource;
};
