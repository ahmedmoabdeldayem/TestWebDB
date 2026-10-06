const { Router } = require('express');
const { createOrder, getOrders, getOrder } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);

module.exports = router;
