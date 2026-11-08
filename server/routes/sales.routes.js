const router = require('express').Router();
const c = require('../controllers/sales.controller');
const { requireAdmin } = require('../middleware/auth');

router.get('/', c.getSales);
router.get('/:id', c.getSaleById);
router.post('/', c.createSale);
router.put('/:id', c.updateSale);
router.delete('/:id', requireAdmin, c.deleteSale);

module.exports = router;
