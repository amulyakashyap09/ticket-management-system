import { Router } from 'express';

import { login } from 'controllers/auth';
import { validatorLogin } from 'middleware/validation/auth';

const router = Router();

router.post('/login', [validatorLogin], login);

export default router;
