import 'mocha';
import 'dotenv/config';
import { expect } from 'chai';
import { agent as request } from 'supertest';
import { Repository } from 'typeorm';

import { initializeDataSource as dbCreateConnection } from '../src/orm/dbCreateConnection';
import { User } from '../src/orm/entities/User';
import { Ticket } from '../src/orm/entities/Ticket';

import { app } from '../src';

function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}

function generatePostgresTimestamp(inputDate: string): string {
  const now: Date = new Date(inputDate);

  const year: number = now.getFullYear();
  const month: string = padZero(now.getMonth() + 1); // getMonth() returns 0-11
  const day: string = padZero(now.getDate());
  const hours: string = padZero(now.getHours());
  const minutes: string = padZero(now.getMinutes());
  const seconds: string = padZero(now.getSeconds());
  const milliseconds: string = now.getMilliseconds().toString().padStart(3, '0');

  // PostgreSQL accepts up to 6 digits for fractional seconds
  const microseconds: string = milliseconds + '000';

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${microseconds}`;
}

describe('Ticket', () => {
  let dbConnection;
  let ticketId: number;
  let userRepository: Repository<User>;
  let ticketRepository: Repository<Ticket>;

  const userPassword = 'test@123';
  let userToken = null;
  let userId: number | null = null;
  const user = new User();
  user.name = 'Test-1';
  user.email = 'test@test.com';
  user.password = userPassword;
  user.type = 'customer';
  user.hashPassword();

  before(async () => {
    dbConnection = await dbCreateConnection();
    userRepository = dbConnection.getRepository(User);
    ticketRepository = dbConnection.getRepository(Ticket);
  });

  beforeEach(async () => {
    const userDetails = await userRepository.save([user]);
    const res = await request(app).post('/auth/login').send({
      email: user.email,
      password: userPassword,
    });
    userToken = res.body.data.token;
    userId = userDetails[0].id;
  });

  afterEach(async () => {
    await userRepository.delete([user.id]);
  });

  it('should not create a new ticket due to bad payload', async () => {
    const res = await request(app).post('/tickets').set('Authorization', `Bearer ${userToken}`).send({
      title: 'ticket-test',
      description: 'ticket-test',
      status: 'closed',
      price: 200,
      priority: 'low',
    });

    expect(res.status).to.equal(400);
    expect(res.body.errorType).to.equal('Validation');
    expect(res.body.errorMessage).to.equal('Register validation error');
  });

  it('should create a new ticket', async () => {
    const res = await request(app).post('/tickets').set('Authorization', `Bearer ${userToken}`).send({
      title: 'ticket-test',
      description: 'ticket-test',
      type: 'concert',
      venue: 'Delhi',
      status: 'closed',
      price: 200,
      priority: 'low',
      due_date: '2029-10-10 12:06:26',
      created_by: userId,
    });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Ticket successfully saved.');
    expect(Object.keys(res.body.data)).to.eql([
      'id',
      'title',
      'description',
      'type',
      'venue',
      'status',
      'price',
      'priority',
      'due_date',
      'created_by',
      'assigneduser',
    ]);
    await ticketRepository.delete({ id: res.body.data.id });
  });

  it('should fetch an existing ticket with all details', async () => {
    const ticket = new Ticket();
    ticket.title = 'ticket-test';
    ticket.description = 'ticket-test';
    ticket.type = 'concert';
    ticket.venue = 'Delhi';
    ticket.status = 'closed';
    ticket.price = 200;
    ticket.priority = 'low';
    ticket.due_date = new Date(generatePostgresTimestamp('2029-10-10 12:06:26'));
    ticket.created_by = userId ?? 0;

    const ticketDetails = await ticketRepository.save([ticket]);
    const ticketId = ticketDetails[0].id;

    const res = await request(app)
      .get('/tickets/' + ticketId)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Ticket found');
    expect(res.body.data.id).to.equal(ticketId);
    expect(res.body.data.title).to.equal(ticket.title);
    await ticketRepository.delete({ id: ticketId });
  });

  it('should fetch ticket analytics', async () => {
    try {
      const newids: number[] = [];

      const types = ['concert', 'movie', 'sports', 'theatre', 'exhibition'];
      const venues = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'];
      const statuses = ['open', 'closed'];
      const priorities = ['low', 'medium', 'high'];

      for (let i = 0; i < 10; i++) {
        const ticket = new Ticket();
        ticket.title = 'ticket-test-' + i;
        ticket.description = 'ticket-test-' + i;
        ticket.type = types[Math.floor(Math.random() * types.length)];
        ticket.venue = venues[Math.floor(Math.random() * venues.length)];
        ticket.status = statuses[i % 2 === 0 ? 0 : 1];
        ticket.price = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
        ticket.priority = priorities[Math.floor(Math.random() * priorities.length)];
        ticket.due_date = new Date(generatePostgresTimestamp('2029-10-10 12:06:26'));
        ticket.created_by = userId ?? 0;

        const ticketDetails = await ticketRepository.save([ticket]);
        const ticketId = ticketDetails[0].id;
        newids.push(ticketId);
      }

      const res = await request(app).get('/tickets/analytics').set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(200);
      await ticketRepository.delete(newids);
    } catch (error) {
      console.trace('Error', error);
    }
  });

  it('should assign ticket to user', async () => {
    let ticketDetails: any;

    const ticket = new Ticket();
    ticket.title = 'ticket-test';
    ticket.description = 'ticket-test';
    ticket.type = 'concert';
    ticket.venue = 'Delhi';
    ticket.status = 'open';
    ticket.price = 200;
    ticket.priority = 'low';
    ticket.due_date = new Date(generatePostgresTimestamp('2029-10-10 12:06:26'));
    ticket.created_by = userId ?? 0;
    ticket.assigneduser = [];
    ticketDetails = await ticketRepository.save([ticket]);
    ticketId = ticketDetails[0].id;

    const res = await request(app).put(`/tickets/${ticketId}/assign`).set('Authorization', `Bearer ${userToken}`).send({
      userId: userId,
    });
    expect(res.status).to.equal(200);
  });

  it('should fail , if neither admin nor creator', async () => {
    const res = await request(app).put(`/tickets/${ticketId}/assign`).set('Authorization', `Bearer ${userToken}`).send({
      userId: userId,
    });
    expect(res.status).to.equal(400);
    expect(res.body.errorType).to.equal('Raw');
    expect(res.body.errorMessage).to.equal('Unauthorized');
    await ticketRepository.delete({ id: ticketId });
  });
});
