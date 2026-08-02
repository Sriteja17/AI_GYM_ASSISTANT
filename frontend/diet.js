// ====================================
// DIET PAGE - AI MEAL PLAN GENERATOR
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🥗 Diet Planner loaded');

    // DOM Elements
    const calorieInput = document.getElementById('calorieInput');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const generateBtn = document.getElementById('generateBtn');
    const mealPlanResult = document.getElementById('mealPlanResult');
    const savedPlansList = document.getElementById('savedPlansList');

    // Dietary preference checkboxes
    const prefVegetarian = document.getElementById('prefVegetarian');
    const prefVegan = document.getElementById('prefVegan');
    const prefHighProtein = document.getElementById('prefHighProtein');
    const prefLowCarb = document.getElementById('prefLowCarb');
    const prefGlutenFree = document.getElementById('prefGlutenFree');
    const prefDairyFree = document.getElementById('prefDairyFree');

    let currentMealPlan = null;

    // Check required elements
    if (!calorieInput || !generateBtn) {
        console.error('❌ Required elements not found!');
        return;
    }

    // Load saved plans on startup
    renderSavedPlans();

    // =========================================
    // EVENT LISTENERS
    // =========================================

    // Preset buttons
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const calories = btn.dataset.calories;
            calorieInput.value = calories;

            // Update active state
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Update preset buttons when input changes
    calorieInput.addEventListener('input', () => {
        const value = calorieInput.value;
        presetBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.calories === value);
        });
    });

    // Generate button
    generateBtn.addEventListener('click', () => {
        console.log('Generate button clicked');
        generateMealPlan();
    });

    // =========================================
    // GENERATE MEAL PLAN
    // =========================================

    async function generateMealPlan() {
        const calories = parseInt(calorieInput.value);

        if (!calories || calories < 1000 || calories > 5000) {
            showToast('Please enter a valid calorie target (1000-5000)', 'error');
            return;
        }

        // Gather dietary preferences
        const preferences = [];
        if (prefVegetarian?.checked) preferences.push('vegetarian');
        if (prefVegan?.checked) preferences.push('vegan');
        if (prefHighProtein?.checked) preferences.push('high protein');
        if (prefLowCarb?.checked) preferences.push('low carb');
        if (prefGlutenFree?.checked) preferences.push('gluten free');
        if (prefDairyFree?.checked) preferences.push('dairy free');

        console.log('Generating meal plan:', { calories, preferences });

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_BASE_URL}/diet/meal-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ calories, preferences })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate meal plan');
            }

            const data = await response.json();
            console.log('Meal plan generated:', data);

            currentMealPlan = {
                calories,
                preferences,
                content: data.mealPlan,
                createdAt: new Date().toISOString()
            };

            renderMealPlan(data.mealPlan);
            showToast('Meal plan generated successfully! 🥗', 'success');

        } catch (error) {
            console.error('Error generating meal plan:', error);
            showToast(error.message || 'Failed to generate meal plan', 'error');
            renderError(error.message);
        } finally {
            setLoading(false);
        }
    }

    // =========================================
    // RENDER FUNCTIONS
    // =========================================

    function renderMealPlan(markdown) {
        // Convert markdown to HTML
        const htmlContent = marked.parse(markdown);

        mealPlanResult.innerHTML = `
            <div class="recipe-content">
                ${htmlContent}
            </div>
            <div class="recipe-actions">
                <button class="btn btn-secondary" onclick="window.dietPage.savePlan()">
                    <i class="fas fa-bookmark"></i>
                    <span>Save Plan</span>
                </button>
                <button class="btn btn-secondary" onclick="window.dietPage.printPlan()">
                    <i class="fas fa-print"></i>
                    <span>Print</span>
                </button>
                <button class="btn btn-secondary" onclick="window.dietPage.copyPlan()">
                    <i class="fas fa-copy"></i>
                    <span>Copy</span>
                </button>
            </div>
        `;

        mealPlanResult.classList.add('active');

        // Scroll to result
        mealPlanResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderError(message) {
        mealPlanResult.innerHTML = `
            <div class="error-state">
                <span class="error-icon">❌</span>
                <p>Failed to generate meal plan</p>
                <small>${message}</small>
            </div>
        `;
        mealPlanResult.classList.add('active');
    }

    function setLoading(isLoading) {
        if (isLoading) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = `
                <span>Generating...</span>
                <i class="fas fa-spinner fa-spin"></i>
            `;
            mealPlanResult.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner">🥗</div>
                    <p>Creating your personalized meal plan...</p>
                    <small>This may take a few seconds</small>
                </div>
            `;
            mealPlanResult.classList.add('active');
        } else {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `
                <span>Generate Meal Plan</span>
                <i class="fas fa-wand-magic-sparkles"></i>
            `;
        }
    }

    // =========================================
    // SAVED PLANS (LocalStorage)
    // =========================================

    function getSavedPlansKey() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return `mealPlans_${user._id || 'guest'}`;
    }

    function getSavedPlans() {
        try {
            return JSON.parse(localStorage.getItem(getSavedPlansKey()) || '[]');
        } catch {
            return [];
        }
    }

    function savePlan() {
        if (!currentMealPlan) {
            showToast('No meal plan to save', 'error');
            return;
        }

        const plans = getSavedPlans();
        const newPlan = {
            id: Date.now(),
            ...currentMealPlan
        };

        plans.unshift(newPlan);

        // Keep only last 10 plans
        if (plans.length > 10) {
            plans.pop();
        }

        localStorage.setItem(getSavedPlansKey(), JSON.stringify(plans));
        renderSavedPlans();
        showToast('Meal plan saved! 📋', 'success');
    }

    let pendingDeleteId = null;

    function confirmDeletePlan(id) {
        pendingDeleteId = id;

        // Use the existing confirm modal
        const modal = document.getElementById('confirmModal');
        const modalIcon = document.getElementById('confirmModalIcon');
        const modalTitle = document.getElementById('confirmModalTitle');
        const modalMessage = document.getElementById('confirmModalMessage');
        const confirmBtn = document.getElementById('confirmModalConfirm');
        const cancelBtn = document.getElementById('confirmModalCancel');

        if (modal) {
            modalIcon.textContent = '🗑️';
            modalTitle.textContent = 'Delete Meal Plan?';
            modalMessage.textContent = 'Are you sure you want to delete this saved meal plan? This action cannot be undone.';
            confirmBtn.textContent = 'Delete';
            modal.classList.add('active');

            // Set up event handlers
            confirmBtn.onclick = () => {
                deletePlanConfirmed();
                modal.classList.remove('active');
            };

            cancelBtn.onclick = () => {
                pendingDeleteId = null;
                modal.classList.remove('active');
            };
        } else {
            // Fallback to browser confirm
            if (confirm('Are you sure you want to delete this meal plan?')) {
                deletePlanConfirmed();
            }
        }
    }

    function deletePlanConfirmed() {
        if (!pendingDeleteId) return;

        const plans = getSavedPlans().filter(p => p.id !== pendingDeleteId);
        localStorage.setItem(getSavedPlansKey(), JSON.stringify(plans));
        renderSavedPlans();
        showToast('Meal plan deleted', 'info');
        pendingDeleteId = null;
    }

    function deletePlan(id) {
        confirmDeletePlan(id);
    }

    function loadPlan(id) {
        const plans = getSavedPlans();
        const plan = plans.find(p => p.id === id);

        if (plan) {
            currentMealPlan = plan;
            calorieInput.value = plan.calories;

            // Update preset buttons
            presetBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.calories === String(plan.calories));
            });

            renderMealPlan(plan.content);
        }
    }

    function renderSavedPlans() {
        const plans = getSavedPlans();

        if (plans.length === 0) {
            savedPlansList.innerHTML = `
                <p class="text-muted">No saved meal plans yet. Generate one and save it!</p>
            `;
            return;
        }

        savedPlansList.innerHTML = plans.map(plan => {
            const date = new Date(plan.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const prefsDisplay = plan.preferences?.length > 0
                ? plan.preferences.join(', ')
                : 'No restrictions';

            return `
                <div class="favorite-card">
                    <div class="fav-info" onclick="window.dietPage.loadPlan(${plan.id})">
                        <strong>🔥 ${plan.calories} cal</strong>
                        <span class="fav-meta">${prefsDisplay} • ${formattedDate}</span>
                    </div>
                    <div class="fav-actions">
                        <button class="action-btn-icon" onclick="window.dietPage.loadPlan(${plan.id})" title="Load">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn-icon btn-delete" onclick="window.dietPage.deletePlan(${plan.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function printPlan() {
        window.print();
    }

    function copyPlan() {
        if (!currentMealPlan) return;

        navigator.clipboard.writeText(currentMealPlan.content)
            .then(() => showToast('Meal plan copied to clipboard!', 'success'))
            .catch(() => showToast('Failed to copy', 'error'));
    }

    // =========================================
    // EXPOSE FUNCTIONS GLOBALLY
    // =========================================

    window.dietPage = {
        savePlan,
        deletePlan,
        loadPlan,
        printPlan,
        copyPlan
    };
});
