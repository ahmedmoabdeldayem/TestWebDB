const { Router } = require('express');
const { getAll, getOne, getCategories } = require('../controllers/productController');

const router = Router();

router.get('/', getAll);
router.get('/categories', getCategories);
router.get('/:id', getOne);

module.exports = router;
