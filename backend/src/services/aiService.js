const Groq = require("groq-sdk");

// Check if API key exists
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    console.error('❌ GROQ_API_KEY is not set in environment variables!');
} else {
    console.log('🔑 Groq API Key found (length:', apiKey.length, ')');
}

// Initialize Groq client
const groq = new Groq({
    apiKey: apiKey
});

console.log('✅ Groq AI (Llama 3.3 70B) initialized and ready!');

/**
 * Generate a recipe based on ingredients and meal type using Groq AI
 * @param {string[]} ingredients - List of ingredients
 * @param {string} mealType - Type of meal (breakfast, lunch, etc.)
 * @returns {Promise<string>} - Generated recipe in markdown format
 */
const generateRecipe = async (ingredients, mealType) => {
    try {
        console.log('🤖 Calling Groq AI for recipe generation...');
        console.log('📝 Ingredients:', ingredients);
        console.log('🍽️ Meal type:', mealType);

        // Add randomization to ensure different recipes each time
        const cookingStyles = ['grilled', 'baked', 'stir-fried', 'steamed', 'sautéed', 'roasted', 'pan-seared', 'slow-cooked'];
        const cuisines = ['Mediterranean', 'Asian', 'Mexican', 'Italian', 'Indian', 'American', 'Thai', 'Japanese', 'Greek', 'Middle Eastern'];
        const variations = ['classic', 'fusion', 'modern twist', 'traditional', 'light and fresh', 'protein-packed', 'comfort food style', 'gourmet'];

        const randomStyle = cookingStyles[Math.floor(Math.random() * cookingStyles.length)];
        const randomCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        const randomSeed = Date.now(); // Unique timestamp for each request

        const prompt = `Create a UNIQUE and creative ${mealType} recipe using these ingredients: ${ingredients.join(", ")}.

IMPORTANT: This is request #${randomSeed}. Create a DIFFERENT recipe than any previous ones.
Style: ${randomStyle} | Cuisine inspiration: ${randomCuisine} | Approach: ${randomVariation}

You can add common pantry items (oil, spices, water, etc.) if needed.

Please format the response in Markdown with the following structure:
## [Creative Recipe Name]

### 📊 Nutritional Info (Approx)
- Calories:
- Protein:
- Carbs:
- Fats:

### 🛒 Ingredients
- [List all ingredients with quantities]

### 🔪 Instructions
1. [Step 1]
2. [Step 2]
...

### 💡 Chef's Tip
[One helpful cooking tip]`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a creative professional chef and nutritionist. Each recipe you create must be UNIQUE and DIFFERENT from previous ones. Be creative with names, flavors, and cooking techniques."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 1.0, // Higher temperature for more variety
            max_tokens: 1024,
        });

        const text = chatCompletion.choices[0]?.message?.content || '';
        console.log('✅ AI recipe generated successfully!');
        return text;

    } catch (error) {
        console.error('❌ Groq API Error:', error.message);
        throw new Error(`Failed to generate recipe: ${error.message}`);
    }
};

/**
 * Generate a random healthy recipe using Groq AI
 * @returns {Promise<string>} - Generated recipe in markdown format
 */
const generateRandomRecipe = async () => {
    try {
        console.log('🤖 Calling Groq AI for random recipe...');

        // Random elements to ensure variety
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'post-workout meal', 'pre-workout meal', 'brunch'];
        const cuisines = ['Mediterranean', 'Asian', 'Mexican', 'Italian', 'Indian', 'American', 'Thai', 'Japanese', 'Greek', 'Middle Eastern', 'Korean', 'Vietnamese', 'French'];
        const proteins = ['chicken', 'beef', 'fish', 'shrimp', 'tofu', 'eggs', 'salmon', 'turkey', 'lamb', 'lentils', 'chickpeas', 'quinoa'];
        const cookingMethods = ['grilled', 'baked', 'stir-fried', 'steamed', 'roasted', 'pan-seared', 'slow-cooked', 'air-fried', 'poached'];
        const dietaryFocus = ['high-protein', 'low-carb', 'balanced macros', 'muscle-building', 'lean and clean', 'energy-boosting', 'recovery-focused'];

        const randomMealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
        const randomCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
        const randomProtein = proteins[Math.floor(Math.random() * proteins.length)];
        const randomMethod = cookingMethods[Math.floor(Math.random() * cookingMethods.length)];
        const randomDiet = dietaryFocus[Math.floor(Math.random() * dietaryFocus.length)];
        const randomSeed = Date.now();

        console.log(`🎲 Random selection: ${randomCuisine} ${randomMethod} ${randomProtein} for ${randomMealType}`);

        const prompt = `SURPRISE ME! Create a completely UNIQUE and delicious ${randomMealType} recipe.

Request ID: #${randomSeed} - Make this recipe DIFFERENT from any previous ones!

Theme: ${randomCuisine} cuisine | Main protein: ${randomProtein} | Cooking style: ${randomMethod} | Focus: ${randomDiet}

Create a creative, healthy, and delicious recipe that a fitness enthusiast would love.

Please format the response in Markdown with the following structure:
## [Creative & Unique Recipe Name]

### 📊 Nutritional Info (Approx)
- Calories:
- Protein:
- Carbs:
- Fats:

### 🛒 Ingredients
- [List all ingredients with quantities]

### 🔪 Instructions
1. [Step 1]
2. [Step 2]
...

### 💡 Chef's Tip
[One helpful cooking tip]`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an innovative professional chef who NEVER repeats recipes. Each dish you create is completely unique with creative names, unexpected flavor combinations, and exciting presentations. Surprise the user with something new every time!"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 1.2, // Maximum creativity for variety
            max_tokens: 1024,
        });

        const text = chatCompletion.choices[0]?.message?.content || '';
        console.log('✅ Random AI recipe generated successfully!');
        return text;

    } catch (error) {
        console.error('❌ Groq API Error:', error.message);
        throw new Error(`Failed to generate random recipe: ${error.message}`);
    }
};

/**
 * Generate a full day meal plan based on calorie target and preferences
 * @param {number} calories - Daily calorie target
 * @param {string[]} preferences - Dietary preferences (vegetarian, vegan, etc.)
 * @returns {Promise<string>} - Generated meal plan in markdown format
 */
const generateMealPlan = async (calories, preferences = []) => {
    try {
        console.log('🤖 Calling Groq AI for meal plan generation...');
        console.log('🔥 Calorie target:', calories);
        console.log('🥗 Preferences:', preferences);

        const randomSeed = Date.now();
        const preferencesText = preferences.length > 0
            ? `Dietary requirements: ${preferences.join(', ')}.`
            : 'No specific dietary restrictions.';

        const prompt = `Create a complete daily meal plan for someone targeting ${calories} calories per day.

${preferencesText}

Request #${randomSeed} - Create a UNIQUE and varied meal plan.

The meal plan should include:
1. Breakfast
2. Morning Snack  
3. Lunch
4. Afternoon Snack
5. Dinner
6. Optional Evening Snack (if calories allow)

For EACH meal, provide:
- Name of the dish
- Approximate calories
- Quick description
- Key macros (protein, carbs, fats)

Format the response in Markdown:

## 🍽️ Your ${calories} Calorie Meal Plan

### Daily Macro Breakdown
| Macro | Target |
|-------|--------|
| Calories | ${calories} |
| Protein | [calculate appropriate] |
| Carbs | [calculate appropriate] |
| Fats | [calculate appropriate] |

---

### 🌅 Breakfast (~[calories] cal)
**[Dish Name]**
- Description: [brief description]
- Protein: [g] | Carbs: [g] | Fats: [g]

### 🍎 Morning Snack (~[calories] cal)
**[Dish Name]**
- Description: [brief description]
- Protein: [g] | Carbs: [g] | Fats: [g]

### 🥗 Lunch (~[calories] cal)
**[Dish Name]**
- Description: [brief description]
- Protein: [g] | Carbs: [g] | Fats: [g]

### 🍌 Afternoon Snack (~[calories] cal)
**[Dish Name]**
- Description: [brief description]
- Protein: [g] | Carbs: [g] | Fats: [g]

### 🍽️ Dinner (~[calories] cal)
**[Dish Name]**
- Description: [brief description]
- Protein: [g] | Carbs: [g] | Fats: [g]

### 🌙 Evening Snack (Optional) (~[calories] cal)
**[Dish Name]**
- Description: [brief description]
- Protein: [g] | Carbs: [g] | Fats: [g]

---

### 💡 Tips for Success
- [2-3 helpful tips for following this meal plan]

### 🛒 Shopping List Highlights
- [Key ingredients to have on hand]`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert nutritionist and meal planner. Create balanced, delicious, and practical meal plans that are easy to follow. Ensure the total calories add up to the target and macros are well-distributed throughout the day. Be specific with portion sizes."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.9,
            max_tokens: 2048,
        });

        const text = chatCompletion.choices[0]?.message?.content || '';
        console.log('✅ AI meal plan generated successfully!');
        return text;

    } catch (error) {
        console.error('❌ Groq API Error:', error.message);
        throw new Error(`Failed to generate meal plan: ${error.message}`);
    }
};

module.exports = {
    generateRecipe,
    generateRandomRecipe,
    generateMealPlan
};
