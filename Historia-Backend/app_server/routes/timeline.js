var express = require('express');
var router = express.Router();
const timelineCtrl = require('../controllers/timeline');
const { auth } = require('../middleware/authentication');

router.post('/', auth, timelineCtrl.createTimeline);
router.get('/', auth, timelineCtrl.getAllTimelines);
router.put('/', auth, timelineCtrl.editTimeline);
router.delete('/', auth, timelineCtrl.deleteTimeline);

module.exports = router;
