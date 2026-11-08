const router = require('express').Router();
const c = require('../controllers/sales.controller');

router.get('/', c.getSales);
router.get('/:id', c.getSaleById);
router.post('/', c.createSale);
router.put('/:id', c.updateSale);
router.post('/:id/pay', c.paySale);
router.post('/:id/cancel', c.cancelSale);
router.delete('/:id', c.deleteSale);

module.exports = router;
