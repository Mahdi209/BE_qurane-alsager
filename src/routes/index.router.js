const express = require('express');
const router = express.Router();
const roleRoutes = require('./role.router');
const adminRoutes = require('./admin.router');
const categoryRoutes = require('./category.router');
const ageGroupRoutes = require('./ageGroup.router');
const questionRoutes = require('./questions.router');
const timeRoutes = require('./time.router');
const opLogRoutes = require('./opLog.router');
const suggestionRoutes = require('./suggestion.router');
const deletionRoutes = require('./deletion.router');
const searchRoutes = require('./search.router');
const contact = require('./contactUS.router');
const versionRouter = require("./version.router");
const appLinkRoutes = require("./appLink.router");

router.use('/roles', roleRoutes);
router.use('/admin', adminRoutes);
router.use('/categories', categoryRoutes);
router.use('/ageGroups', ageGroupRoutes);
router.use('/questions', questionRoutes);
router.use('/time', timeRoutes);
router.use('/logs', opLogRoutes);
router.use('/suggestions', suggestionRoutes);
router.use('/deletions', deletionRoutes)
router.use('/search', searchRoutes);
router.use('/contact', contact);
router.use('/version', versionRouter);
router.use('/appLink', appLinkRoutes);




module.exports = router;
