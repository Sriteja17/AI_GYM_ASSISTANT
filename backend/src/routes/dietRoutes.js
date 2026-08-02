const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const aiService = require('../services/aiService');

// @route   POST /api/diet/meal-plan
// @desc    Generate a full day meal plan based on calorie target
// @access  Private
router.post('/meal-plan', authMiddleware, async (req, res) => {
    try {
        const { calories, preferences } = req.body;

        console.log('Meal plan request:', { calories, preferences });

        if (!calories || calories < 1000 || calories > 5000) {
            return res.status(400).json({ error: 'Please provide a valid calorie target (1000-5000)' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(503).json({ error: 'AI service unavailable (API Key missing)' });
        }

        const mealPlan = await aiService.generateMealPlan(calories, preferences || []);

        console.log('Meal plan generated successfully');
        res.json({ mealPlan });
    } catch (error) {
        console.error('Meal plan generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate meal plan' });
    }
});

// @route   POST /api/diet/generate
// @desc    Generate a recipe based on ingredients
// @access  Private
router.post('/generate', authMiddleware, async (req, res) => {
    try {
        const { ingredients, mealType } = req.body;

        console.log('Generate recipe request:', { ingredients, mealType });

        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ error: 'Please provide a list of ingredients' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(503).json({ error: 'AI service unavailable (API Key missing)' });
        }

        const recipe = await aiService.generateRecipe(ingredients, mealType || 'meal');

        console.log('Recipe generated successfully');
        res.json({ recipe });
    } catch (error) {
        console.error('Recipe generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate recipe' });
    }
});

// @route   POST /api/diet/random
// @desc    Generate a random healthy recipe
// @access  Private
router.post('/random', authMiddleware, async (req, res) => {
    try {
        console.log('Random recipe request');

        if (!process.env.GROQ_API_KEY) {
            return res.status(503).json({ error: 'AI service unavailable (API Key missing)' });
        }

        const recipe = await aiService.generateRandomRecipe();

        console.log('Random recipe generated successfully');
        res.json({ recipe });
    } catch (error) {
        console.error('Random recipe error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate recipe' });
    }
});

// @route   GET /api/diet/suggestions
// @desc    Get ingredient suggestions based on usage
// @access  Private
router.get('/suggestions', authMiddleware, async (req, res) => {
    try {
        // For now, return common ingredients as suggestions
        // We can enhance this with Redis tracking later
        const commonIngredients = [
            'chicken', 'rice', 'eggs', 'pasta', 'beef', 'salmon',
            'broccoli', 'spinach', 'tomato', 'onion', 'garlic',
            'potato', 'cheese', 'milk', 'yogurt', 'bread'
        ];

        const query = req.query.q?.toLowerCase() || '';

        if (!query) {
            return res.json({ suggestions: [] });
        }

        // Filter suggestions based on query
        const suggestions = commonIngredients.filter(ing => ing.startsWith(query));

        res.json({ suggestions: suggestions.slice(0, 5) });
    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
