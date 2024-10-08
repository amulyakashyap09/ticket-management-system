import { Request, Response, NextFunction } from 'express';
import { initializeDataSource } from '../orm/dbCreateConnection';
import { CustomError } from 'utils/response/custom-error/CustomError';
import { QueryRunner } from 'typeorm';
import * as types from 'pg-types';


/**
 * Pads a number with leading zeros to ensure it has at least two digits.
 *
 * @param num - The number to pad with leading zeros.
 * @returns The number as a string, padded with leading zeros if necessary.
 */
function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}


/**
 * Generates a PostgreSQL-compatible timestamp string from a given input date string.
 *
 * @param {string} inputDate - The input date string to be converted into a PostgreSQL timestamp.
 * @returns {string} A string representing the timestamp in the format `YYYY-MM-DD HH:MM:SS.mmm000`.
 *
 * @example
 * ```typescript
 * const timestamp = generatePostgresTimestamp('2023-10-05T14:48:00.000Z');
 * console.log(timestamp); // Outputs: '2023-10-05 14:48:00.000000'
 * ```
 */
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

/**
 * Creates a new ticket and saves it to the database.
 *
 * @param req - The request object containing the ticket data in the body and JWT payload.
 * @param res - The response object used to send the success response.
 * @param next - The next middleware function in the stack.
 *
 * @remarks
 * This function extracts the ticket data from the request body and the user ID from the JWT payload.
 * It initializes the data source and gets the ticket repository to save the new ticket.
 * If the ticket is successfully saved, it sends a success response with the saved ticket data.
 * If an error occurs, it creates a custom error and passes it to the next middleware.
 *
 * @throws {CustomError} - If the ticket cannot be saved, a custom error is thrown with a 409 status code.
 */
export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  const ticket = req.body;
  const jwtPayload = req.jwtPayload;
  ticket.created_by = jwtPayload.id;

  const due_date = new Date(ticket.due_date);
  if (due_date <= new Date()) {
    const customError = new CustomError(400, 'Raw', 'Due date must be in the future.');
    return next(customError);
  }

  const _dataSource = await initializeDataSource();
  const queryRunner: QueryRunner = _dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const sql = `
            INSERT INTO tickets (title, description, type, venue, status, price, priority, due_date, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;

    const parameters = [
      ticket.title,
      ticket.description,
      ticket.type,
      ticket.venue,
      ticket.status,
      ticket.price,
      ticket.priority,
      generatePostgresTimestamp(due_date.toISOString()),
      parseInt(ticket.created_by),
    ];

    const savedTicket = await queryRunner.query(sql, parameters);

    await queryRunner.commitTransaction();
    await queryRunner.release();

    res.customSuccess(200, 'Ticket successfully saved.', { ...savedTicket[0] });
  } catch (err) {
    console.trace(err);
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
    const customError = new CustomError(409, 'Raw', `Ticket '${ticket.name}' can't be saved.`, null, err);
    return next(customError);
  }
};


/**
 * Retrieves a ticket by its ID and returns the ticket details along with assigned users.
 * 
 * @param req - The request object containing the ticket ID in the parameters.
 * @param res - The response object used to send the response back to the client.
 * @param next - The next middleware function in the Express.js request-response cycle.
 * 
 * @throws Will throw an error if the ticket is not found or if there is an issue with the database query.
 * 
 * @remarks
 * This function initializes a data source and creates a query runner to execute SQL queries.
 * It overrides the type parser for PostgreSQL `INT[]` to convert the string array elements to numbers.
 * If the ticket is found, it retrieves the assigned users and replaces the `assigneduser` field with user details.
 * If an error occurs, it releases the query runner and passes a custom error to the next middleware.
 */
export const getTicket = async (req: Request, res: Response, next: NextFunction) => {
  const _dataSource = await initializeDataSource();
  const queryRunner: QueryRunner = _dataSource.createQueryRunner();

  // Override the type parser for PostgreSQL `INT[]` (OID 1007)
  types.setTypeParser(1007 as types.TypeId, (val: string): number[] => {
    return val
      .slice(1, -1) // Remove curly braces
      .split(',') // Split by commas
      .map(Number); // Convert string array elements to numbers
  });

  try {
    await queryRunner.connect();

    const sql = `
            SELECT * FROM tickets WHERE id = $1;
        `;

    const ticket = await queryRunner.query(sql, [parseInt(req.params.ticketId)]);

    if (ticket.length === 0) {
      throw new Error('Ticket not found');
    }

    const assignedUsers: number[] = ticket[0].assigneduser;

    const sql2 = `SELECT id, name, email from users WHERE id = ANY($1)`;
    const users = await queryRunner.query(sql2, [assignedUsers]);
    ticket[0].assigneduser = users;

    await queryRunner.release();

    res.customSuccess(200, 'Ticket found', { ...ticket[0] });
  } catch (err) {
    // console.trace(err);
    await queryRunner.release();
    const customError = new CustomError(400, 'Raw', `Can't retrieve ticket.`, null, err);
    return next(customError);
  }
};



/**
 * Retrieves ticket analytics based on the provided query parameters.
 * 
 * @param req - The request object containing query parameters for filtering tickets.
 * @param res - The response object used to send back the analytics data.
 * @param next - The next middleware function in the Express.js request-response cycle.
 * 
 * @remarks
 * The function filters tickets based on the provided query parameters such as startDate, endDate, status, priority, type, and venue.
 * It then calculates various analytics including total tickets, closed tickets, open tickets, in-progress tickets, priority distribution, and type distribution.
 * The analytics data along with the filtered ticket details are sent back in the response.
 * 
 * @throws CustomError - Throws a custom error if there is an issue retrieving ticket analytics.
 * 
 * @example
 * // Example request:
 * // GET /api/tickets/analytics?startDate=2023-01-01&endDate=2023-12-31&status=open
 * 
 * // Example response:
 * // {
 * //   totalTickets: 100,
 * //   closedTickets: 50,
 * //   openTickets: 30,
 * //   inProgressTickets: 20,
 * //   priorityDistribution: { low: 40, medium: 40, high: 20 },
 * //   typeDistribution: { concert: 50, conference: 30, sports: 20 },
 * //   tickets: [
 * //     {
 * //       id: 1,
 * //       title: "Concert Ticket",
 * //       status: "open",
 * //       priority: "high",
 * //       type: "concert",
 * //       venue: "Stadium",
 * //       createdDate: "2023-01-01",
 * //       created_by: "user1"
 * //     },
 * //     ...
 * //   ]
 * // }
 */
export const getTicketAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  const _dataSource = await initializeDataSource();
  const queryRunner: QueryRunner = _dataSource.createQueryRunner();

  const { startDate, endDate, status, priority, type, venue } = req.query as {
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
    type?: string;
    venue?: string;
  };

  try {
    await queryRunner.connect();

    // Base query for filtering tickets based on query parameters
    let sql = `
            SELECT * FROM tickets WHERE 1 = 1
        `;
    const params: any[] = [];

    // Apply filters
    if (startDate) {
      sql += ` AND createdDate >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND createdDate <= $${params.length + 1}`;
      params.push(endDate);
    }
    if (status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    if (priority) {
      sql += ` AND priority = $${params.length + 1}`;
      params.push(priority);
    }
    if (type) {
      sql += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    if (venue) {
      sql += ` AND venue = $${params.length + 1}`;
      params.push(venue);
    }

    // Fetch filtered tickets
    const tickets = await queryRunner.query(sql, params);

    // Calculate analytics
    const totalTickets = tickets.length;
    const closedTickets = tickets.filter((ticket) => ticket.status === 'closed').length;
    const openTickets = tickets.filter((ticket) => ticket.status === 'open').length;
    const inProgressTickets = tickets.filter((ticket) => ticket.status === 'in-progress').length;

    // Calculate priority distribution
    const priorityDistribution = {
      low: tickets.filter((ticket) => ticket.priority === 'low').length,
      medium: tickets.filter((ticket) => ticket.priority === 'medium').length,
      high: tickets.filter((ticket) => ticket.priority === 'high').length,
    };

    // Calculate type distribution
    const typeDistribution = {
      concert: tickets.filter((ticket) => ticket.type === 'concert').length,
      conference: tickets.filter((ticket) => ticket.type === 'conference').length,
      sports: tickets.filter((ticket) => ticket.type === 'sports').length,
    };

    // Return analytics data along with ticket details
    res.customSuccess(200, 'Analytics fetched successfully', {
      totalTickets,
      closedTickets,
      openTickets,
      inProgressTickets,
      priorityDistribution,
      typeDistribution,
      tickets: tickets.map((obj) => ({
        id: obj.id,
        title: obj.title,
        status: obj.status,
        priority: obj.priority,
        type: obj.type,
        venue: obj.venue,
        createdDate: obj.createdDate,
        created_by: obj.created_by,
      })),
    });

    await queryRunner.release();
  } catch (error) {
    await queryRunner.release();
    const customError = new CustomError(400, 'Raw', `Can't retrieve ticket analytics.`, null, error);
    return next(customError);
  }
};


/**
 * Assigns a user to a ticket.
 *
 * This function assigns a user to a ticket based on the provided ticket ID and user ID.
 * It performs several checks to ensure the validity of the operation, including:
 * - Verifying the existence of the ticket.
 * - Ensuring the ticket is not closed.
 * - Checking if the requester is the creator of the ticket or an admin.
 * - Validating the existence of the user.
 * - Ensuring the user is not an admin.
 * - Checking if the user is already assigned to the ticket.
 * - Ensuring the ticket has not reached the assignment limit.
 *
 * @param req - The request object containing the ticket ID in the params and the user ID in the body.
 * @param res - The response object used to send the success message.
 * @param next - The next middleware function in the stack, used to pass errors.
 * @throws {CustomError} - Throws various custom errors based on the validation checks.
 */
export const assignUserToTicket = async (req: Request, res: Response, next: NextFunction) => {
  types.setTypeParser(1007 as types.TypeId, (val: string): number[] => {
    return val
      .slice(1, -1) // Remove curly braces
      .split(',') // Split by commas
      .map(Number); // Convert string array elements to numbers
  });

  const _dataSource = await initializeDataSource();
  const queryRunner: QueryRunner = _dataSource.createQueryRunner();

  const { ticketId } = req.params;
  const { userId } = req.body;
  const jwtPayload = req.jwtPayload; // User's JWT payload to check creator/admin status
  const parsedUserId = parseInt(userId);
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Check if the ticket exists
    const ticket = await queryRunner.query(`SELECT * FROM tickets WHERE id = $1`, [ticketId]);
    if (!ticket.length) {
      throw new CustomError(404, 'Raw', 'Ticket not found.');
    }

    const currentTicket = ticket[0];

    // Check if the ticket is closed
    if (currentTicket.status === 'closed') {
      throw new CustomError(400, 'Raw', 'Cannot assign users to a closed ticket.');
    }

    // Check if the user making the request is the creator or an admin
    const isAdmin = jwtPayload.type === 'admin';
    const isCreator = currentTicket.created_by === jwtPayload.id;

    if (!isAdmin && !isCreator) {
      throw new CustomError(403, 'Raw', 'Unauthorized');
    }

    // Check if the userId corresponds to a valid user
    const user = await queryRunner.query(`SELECT * FROM users WHERE id = $1`, [parsedUserId]);
    if (!user.length) {
      throw new CustomError(404, 'Raw', 'User does not exist');
    }

    const userToAssign = user[0];

    // Ensure the user is not an admin
    if (userToAssign.role === 'admin') {
      throw new CustomError(400, 'Raw', 'You can’t assign a ticket to an admin.');
    }

    const assignedUsers: number[] = currentTicket.assigneduser;

    if (assignedUsers.includes(parsedUserId)) {
      throw new CustomError(400, 'Raw', 'User already assigned');
    }

    // Check if the ticket has reached the assignment limit (e.g., 5 users per ticket)
    if (assignedUsers.length >= 5) {
      throw new CustomError(400, 'Raw', 'User assignment limit reached');
    }

    // Assign the user to the ticket
    await queryRunner.query(
      `UPDATE tickets
            SET assigneduser = ARRAY_APPEND(assigneduser, $1)
            WHERE id = $2
            RETURNING *;`,
      [parsedUserId, ticketId],
    );

    await queryRunner.commitTransaction();

    res.customSuccess(200, 'User assigned successfully');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    const customError = new CustomError(400, 'Raw', error.message || 'Error assigning user to ticket.', null, error);
    return next(customError);
  } finally {
    await queryRunner.release();
  }
};
