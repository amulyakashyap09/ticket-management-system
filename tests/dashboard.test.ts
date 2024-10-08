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

describe('Dashboard', () => {
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

  it('should fetch dashboard ticket analytics', async () => {
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

    const res = await request(app).get('/dashboard/analytics').set('Authorization', `Bearer ${userToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Success');
    const data = res.body.data;

    expect(data).to.have.property('totalTickets').that.is.a('number');
    expect(data).to.have.property('closedTickets').that.is.a('number');
    expect(data).to.have.property('openTickets').that.is.a('number');
    expect(data).to.have.property('inProgressTickets').that.is.a('number');
    expect(data).to.have.property('averageCustomerSpending').that.is.a('number');
    expect(data).to.have.property('AverageTicketsBookedPerDay').that.is.a('number');

    // Check priorityDistribution object
    expect(data).to.have.property('priorityDistribution').that.is.an('object');
    const priorityDistribution = data.priorityDistribution;
    expect(priorityDistribution).to.have.property('medium').that.is.an('object').and.have.property('count');
    expect(priorityDistribution).to.have.property('high').that.is.an('object').and.have.property('count');
    expect(priorityDistribution).to.have.property('low').that.is.an('object').and.have.property('count');

    // Check typeDistribution object
    expect(data).to.have.property('typeDistribution').that.is.an('object');
    const typeDistribution = data.typeDistribution;
    expect(typeDistribution).to.have.property('concert');
    expect(typeDistribution).to.have.property('movie');
    expect(typeDistribution).to.have.property('exhibition');
    expect(typeDistribution).to.have.property('sports');

    await ticketRepository.delete(newids);
  });
});
