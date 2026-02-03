/**
 * Script to create dish questions for testing
 * Run this script to create sample dish questions in the database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import QuestionModel from './src/models/question.model.js';

// Sample dish questions
const dishQuestions = [
    {
        title: 'Taste and Flavor',
        maxPoint: 25,
        position: 1,
        type: 'dish',
        description: 'Evaluate the taste, flavor balance, and seasoning of the dish'
    },
    {
        title: 'Presentation and Plating',
        maxPoint: 20,
        position: 2,
        type: 'dish',
        description: 'Assess the visual appeal, plating technique, and overall presentation'
    },
    {
        title: 'Creativity and Innovation',
        maxPoint: 20,
        position: 3,
        type: 'dish',
        description: 'Judge the creativity, innovation, and uniqueness of the dish'
    },
    {
        title: 'Technique and Execution',
        maxPoint: 20,
        position: 4,
        type: 'dish',
        description: 'Evaluate the cooking techniques, skill level, and execution quality'
    },
    {
        title: 'Overall Impression',
        maxPoint: 15,
        position: 5,
        type: 'dish',
        description: 'Overall impression and would you want to eat this dish again'
    }
];

async function createDishQuestions(eventId) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gca_db');
        console.log('Connected to MongoDB');

        // Check if event exists
        const EventModel = (await import('./src/models/event.model.js')).default;
        const event = await EventModel.findById(eventId);
        
        if (!event) {
            console.error('Event not found with ID:', eventId);
            return;
        }

        console.log('Creating dish questions for event:', event.name);

        // Create dish questions
        const createdQuestions = [];
        for (const questionData of dishQuestions) {
            const question = new QuestionModel({
                ...questionData,
                eventId: eventId,
                isActive: true
            });
            
            const savedQuestion = await question.save();
            createdQuestions.push(savedQuestion);
            console.log(`Created question: ${savedQuestion.title} (ID: ${savedQuestion._id})`);
        }

        console.log(`\n✅ Successfully created ${createdQuestions.length} dish questions for event: ${event.name}`);
        console.log('Question IDs:');
        createdQuestions.forEach(q => console.log(`- ${q.title}: ${q._id}`));

    } catch (error) {
        console.error('Error creating dish questions:', error);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Usage
const eventId = process.argv[2];

if (!eventId) {
    console.log('Usage: node create-dish-questions.js <eventId>');
    console.log('Example: node create-dish-questions.js 68f18ada3542809c11f9510b');
    process.exit(1);
}

createDishQuestions(eventId);
