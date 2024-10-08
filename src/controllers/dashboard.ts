import { NextFunction, Request, Response } from 'express';
import { initializeDataSource } from 'orm/dbCreateConnection';
import { CustomError } from 'utils/response/custom-error/CustomError';

/**
 * Retrieves ticket analytics based on the provided query parameters.
 *
 * @param req - The request object containing query parameters for filtering tickets.
 * @param res - The response object used to send the analytics data.
 * @param next - The next middleware function in the Express.js request-response cycle.
 *
 * @returns A JSON response containing ticket analytics data, including:
 * - totalTickets: Total number of tickets.
 * - closedTickets: Number of closed tickets.
 * - openTickets: Number of open tickets.
 * - averageCustomerSpending: Average spending per customer.
 * - averageTicketsBookedPerDay: Average number of tickets booked per day.
 * - inProgressTickets: Number of tickets in progress.
 * - priorityDistribution: Distribution of tickets by priority (low, medium, high) and their respective average bookings per day.
 * - typeDistribution: Distribution of tickets by type.
 *
 * @throws CustomError - If there is an error fetching the tickets, a custom error is passed to the next middleware.
 */

export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  const _dataSource = await initializeDataSource();
  const { startDate, endDate, status, priority, type, venue } = req.query as {
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
    type?: string;
    venue?: string;
  };

  const queryRunner = _dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // Base query for filtering tickets
    let baseQuery = `SELECT * FROM tickets WHERE 1 = 1`;

    // Apply optional filters
    if (startDate) {
      baseQuery += ` AND due_date >= '${startDate}' `;
    }
    if (endDate) {
      baseQuery += ` AND due_date <= '${endDate}' `;
    }
    if (status) {
      baseQuery += ` AND status = '${status}' `;
    }
    if (priority) {
      baseQuery += ` AND priority = '${priority}' `;
    }
    if (type) {
      baseQuery += ` AND type = '${type}' `;
    }
    if (venue) {
      baseQuery += ` AND venue = '${venue}' `;
    }

    // Query for total tickets
    const totalTicketsQuery = `${baseQuery}`;
    const totalTickets = await queryRunner.query(totalTicketsQuery);

    // Query for closed, open, and in-progress tickets
    const closedTicketsQuery = `${baseQuery} AND status = 'closed'`;
    const openTicketsQuery = `${baseQuery} AND status = 'open'`;
    const inProgressTicketsQuery = `${baseQuery} AND status = 'in-progress'`;

    const [closedTickets, openTickets, inProgressTickets] = await Promise.all([
      queryRunner.query(closedTicketsQuery),
      queryRunner.query(openTicketsQuery),
      queryRunner.query(inProgressTicketsQuery),
    ]);

    // Query for average customer spending (average ticket price)
    const avgCustomerSpendingQuery = `SELECT AVG(price) as averageSpending FROM tickets WHERE 1 = 1 ${
      startDate ? ` AND due_date >= '${startDate}' ` : ''
    } ${endDate ? ` AND due_date <= '${endDate}' ` : ''}`;
    const avgCustomerSpending = await queryRunner.query(avgCustomerSpendingQuery);

    // Query for average tickets booked per day
    const avgTicketsBookedPerDayQuery = `SELECT COUNT(*) / (DATE_PART('day', MAX(due_date) - MIN(due_date)) + 1) as avgTicketsPerDay FROM tickets WHERE 1 = 1 ${
      startDate ? ` AND due_date >= '${startDate}' ` : ''
    } ${endDate ? ` AND due_date <= '${endDate}' ` : ''}`;
    const avgTicketsBookedPerDay = await queryRunner.query(avgTicketsBookedPerDayQuery);

    // Query for priority distribution
    const priorityDistributionQuery = `SELECT priority, COUNT(*) as count, (COUNT(*) / (DATE_PART('day', MAX(due_date) - MIN(due_date)) + 1)) as avgTicketsPerDay FROM tickets WHERE 1 = 1 ${
      startDate ? ` AND due_date >= '${startDate}' ` : ''
    } ${endDate ? ` AND due_date <= '${endDate}' ` : ''} GROUP BY priority`;
    const priorityDistribution = await queryRunner.query(priorityDistributionQuery);

    // Query for type distribution
    const typeDistributionQuery = `SELECT type, COUNT(*) as count FROM tickets WHERE 1 = 1 ${
      startDate ? ` AND due_date >= '${startDate}' ` : ''
    } ${endDate ? ` AND due_date <= '${endDate}' ` : ''} GROUP BY type`;
    const typeDistribution = await queryRunner.query(typeDistributionQuery);

    // Build the response
    const response = {
      totalTickets: totalTickets.length,
      closedTickets: closedTickets.length,
      openTickets: openTickets.length,
      inProgressTickets: inProgressTickets.length,
      averageCustomerSpending: avgCustomerSpending[0]?.averageSpending || 0,
      AverageTicketsBookedPerDay: avgTicketsBookedPerDay[0]?.avgTicketsPerDay || 0,
      priorityDistribution: priorityDistribution.reduce((acc: any, curr: any) => {
        acc[curr.priority] = {
          count: curr.count,
          avgTicketsPerDay: curr.avgTicketsPerDay,
        };
        return acc;
      }, {}),
      typeDistribution: typeDistribution.reduce((acc: any, curr: any) => {
        acc[curr.type] = curr.count;
        return acc;
      }, {}),
    };
    res.customSuccess(200, 'Success', { ...response });
  } catch (error) {
    console.error('Error fetching ticket analytics:', error);
    const customError = new CustomError(500, 'Raw', 'Error fetching ticket analytics', null, error);
    next(customError);
  } finally {
    await queryRunner.release();
  }
};
