import { Router } from 'express';

import route404 from './general/404';
import root from './general/root';
import auth from './auth';
import users from './users';
import ticket from './tickets';
import dashboard from './dashboard';

const router = Router();

router.use('/auth', auth);
router.use('/users', users);
router.use('/tickets', ticket);
router.use('/dashboard', dashboard);
router.use(root);
router.use(route404);

export default router;
