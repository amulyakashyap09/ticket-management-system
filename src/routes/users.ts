import { Router } from 'express';

import { addUser, getUserDetails } from 'controllers/users';
import { checkJwt } from 'middleware/checkJwt';
import { validatorAdd, userAlreadyExist } from 'middleware/validation/users';

const router = Router();

router.get('/:id([0-9]+)', [checkJwt], getUserDetails);

router.post('/', [validatorAdd], [userAlreadyExist], addUser);

export default router;
