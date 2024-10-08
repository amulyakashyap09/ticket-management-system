import { Router } from 'express';

import { getDashboardAnalytics } from 'controllers/dashboard';
import { checkJwt } from 'middleware/checkJwt';

const router = Router();

router.get('/analytics', [checkJwt], getDashboardAnalytics);

export default router;
