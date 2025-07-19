const Time = require('../models/date');
const { sendResponse } = require('../Utilities/response');

const TimeController = {
    getTime: async (req, res) => {
        try {
            const question = await Time.findOne({ type: "Question" }).sort({ date: -1 });
            const age = await Time.findOne({ type: "Age" }).sort({ date: -1 });
            const category = await Time.findOne({ type: "Category" }).sort({ date: -1 });

            return sendResponse(res, {
                question: question,
                age: age ,
                category: category
            });

        } catch (error) {
            return sendResponse(res, null, error.message, 500);
        }
    },

};

module.exports = TimeController;
