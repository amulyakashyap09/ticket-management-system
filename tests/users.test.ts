import 'mocha';
import 'dotenv/config';
import { expect } from 'chai';
import { agent as request } from 'supertest';
import { Repository } from 'typeorm';

import { initializeDataSource as dbCreateConnection } from '../src/orm/dbCreateConnection';
import { User } from '../src/orm/entities/User';

import { app } from '../src';

describe('Register customer', () => {
  let dbConnection;
  let userRepository: Repository<User>;

  const userPassword = 'pass@123';
  const user = new User();
  user.email = 'bruce@wayne.com';
  user.name = 'Bruce Wayne';
  user.password = userPassword;
  user.hashPassword();
  user.type = 'customer';

  before(async () => {
    dbConnection = await dbCreateConnection();
    userRepository = dbConnection.getRepository(User);
  });

  it('should register a new customer user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: user.email, password: userPassword, type: user.type, name: user.name });
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('User successfully saved.');
    expect(Object.keys(res.body.data)).to.eql(['id', 'name', 'email']);
    await userRepository.delete({ email: user.email });
  });

  it('should report error when email already exists', async () => {
    let res = await request(app)
      .post('/users')
      .send({ email: user.email, password: userPassword, type: user.type, name: user.name });
    res = await request(app)
      .post('/users')
      .send({ email: user.email, password: userPassword, type: user.type, name: user.name });
    expect(res.status).to.equal(400);
    expect(res.body.errorType).to.equal('Validation');
    expect(res.body.errorMessage).to.equal('User already exists');
    expect(res.body.errorsValidation[0].email).to.eql(`Email '${user.email}' already exists`);
    await userRepository.delete({ email: user.email });
  });
});

describe('Register admin', () => {
  let dbConnection;
  let userRepository: Repository<User>;

  const userPassword = 'admin@123';
  const user = new User();
  user.email = 'bruce@admin.com';
  user.name = 'Admin Bruce Wayne';
  user.password = userPassword;
  user.hashPassword();
  user.type = 'admin';

  before(async () => {
    dbConnection = await dbCreateConnection();
    userRepository = dbConnection.getRepository(User);
  });

  it('should register a new admin user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: user.email, password: userPassword, type: user.type, name: user.name });
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('User successfully saved.');
    expect(Object.keys(res.body.data)).to.eql(['id', 'name', 'email']);
    await userRepository.delete({ email: user.email });
  });

  it('should report error when email already exists', async () => {
    let res = await request(app)
      .post('/users')
      .send({ email: user.email, password: userPassword, type: user.type, name: user.name });
    res = await request(app)
      .post('/users')
      .send({ email: user.email, password: userPassword, type: user.type, name: user.name });
    expect(res.status).to.equal(400);
    expect(res.body.errorType).to.equal('Validation');
    expect(res.body.errorMessage).to.equal('User already exists');
    expect(res.body.errorsValidation[0].email).to.eql(`Email '${user.email}' already exists`);
    await userRepository.delete({ email: user.email });
  });
});
