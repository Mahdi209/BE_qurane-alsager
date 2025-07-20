const mongoose = require('mongoose');
const Question = require('../models/questions');

// MongoDB connection string
const mongoURI = 'mongodb://admin:SuperSecurePassword@198.244.227.48:27017/quranalsageraV2?authSource=admin';

async function updateQuestionsFields() {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURI);
        console.log('Connected to database');

        // Update all questions to set app and platform to true
        const result = await Question.updateMany(
            {}, // empty filter to match all documents
            {
                $set: {
                    app: true,
                    platform: true
                }
            }
        );

        console.log(`Successfully updated ${result.modifiedCount} questions`);
        console.log('Update details:', result);

    } catch (error) {
        console.error('Error updating questions:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the update function
updateQuestionsFields();
