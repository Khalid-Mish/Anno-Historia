var express = require('express');
var router = express.Router();
const eventCtrl = require('../controllers/event');
const { auth } = require('../middleware/authentication');

router.post('/', auth, eventCtrl.createEvent);
router.post('/multiples', auth, eventCtrl.createEvents);
router.put('/', auth, eventCtrl.editEvent);
router.delete('/', auth, eventCtrl.deleteEvent);
router.post('/:timelineId/:skip/:time', auth, eventCtrl.getTimelineEvents);
router.get('/:timelineId', auth, eventCtrl.getSortFields);
router.get('/export-csv/:timelineId/:fileName', auth, eventCtrl.exportCSV);
router.get('/export-xlsx/:timelineId/:fileName', auth, eventCtrl.exportXLSX);
router.get('/headers/:timelineId', auth, eventCtrl.getAllHeaders);
router.get('/analytics/:timelineId/:option', auth, eventCtrl.getAnalyticsData);
router.get('/analytics/:timelineId/:option1/:option2', auth, eventCtrl.getComparingChartData);

module.exports = router;
