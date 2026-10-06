const { Router } = require('express');
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cartController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/', getCart);
router.post('/', addItem);
router.put('/:itemId', updateItem);
router.delete('/clear', clearCart);
router.delete('/:itemId', removeItem);

module.exports = router;
