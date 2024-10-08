import { Router } from 'express';

import { createTicket, getTicketAnalytics, getTicket, assignUserToTicket } from 'controllers/tickets';
import { checkJwt } from 'middleware/checkJwt';
import { validatorTicket } from 'middleware/validation/tickets';

const router = Router();

router.get('/analytics', [checkJwt], getTicketAnalytics);
router.get('/:ticketId', [checkJwt], getTicket);
router.put('/:ticketId/assign', [checkJwt], assignUserToTicket);
router.post('/', [checkJwt], [validatorTicket], createTicket);

export default router;
