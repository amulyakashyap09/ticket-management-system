import { Router } from 'express';

const router = Router();

router.get('/', (req, res, next) => {
  res.status(200).header('Content-Type', 'application/json').send({ api: 'RESTful API boilerplate' });
});

export default router;
