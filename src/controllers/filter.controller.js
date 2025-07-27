const Question = require('../models/questions');


const filterController = {
    async getQuestionsByFilter(req, res) {
        try {
            const { ageGroup, category, created_by, createdAt,status } = req.query;

            console.log('Filter parameters:', { ageGroup, category, created_by, createdAt });

            const filter = {};

            if (ageGroup && ageGroup.trim()) {
                filter.ageGroupId = ageGroup.trim();
            }

            if (category && category.trim()) {
                filter.categoryId = category.trim();
            }

            if (created_by && created_by.trim()) {
                filter.created_by = created_by.trim();
            }

            if (createdAt) {
                const date = new Date(createdAt);
                const startOfDay = new Date(date.setHours(0, 0, 0, 0));
                const endOfDay = new Date(date.setHours(23, 59, 59, 999));

                filter.createdAt = {
                    $gte: startOfDay,
                    $lte: endOfDay
                };
            }

            console.log('Filter object:', filter);

            const questions = await Question.find({ is_deleted: false, status: status, ...filter })
                .populate('categoryId', 'name')
                .populate('ageGroupId', 'name')
                .populate('created_by', 'username')
                .populate('updated_by', 'username')
                .populate('deleted_by', 'username')
                .sort({ createdAt: -1 });

            console.log(`Found ${questions.length} questions`);

            res.status(200).json({
                success: true,
                count: questions.length,
                data: questions
            });

        } catch (error) {
            console.error('Error fetching filtered questions:', error);

            if (error.name === 'CastError') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ID format provided'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
}

module.exports = filterController;