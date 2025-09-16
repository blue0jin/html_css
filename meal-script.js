class MealPlanner {
    constructor() {
        this.ingredients = [];
        this.mealPlan = this.loadMealPlan();
        this.currentMealType = '';
        this.currentDay = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadMealPlan();
        this.renderMealPlan();
    }

    bindEvents() {
        // 식자재 검색
        document.getElementById('searchBtn').addEventListener('click', () => this.searchMeals());
        document.getElementById('ingredientInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addIngredient();
        });

        // 액션 버튼들
        document.getElementById('randomBtn').addEventListener('click', () => this.generateRandomMeals());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveMealPlan());
    }

    addIngredient() {
        const input = document.getElementById('ingredientInput');
        const ingredient = input.value.trim();
        
        if (!ingredient) return;
        
        if (!this.ingredients.includes(ingredient)) {
            this.ingredients.push(ingredient);
            this.renderIngredientTags();
            this.searchMeals();
        }
        
        input.value = '';
    }

    removeIngredient(ingredient) {
        this.ingredients = this.ingredients.filter(ing => ing !== ingredient);
        this.renderIngredientTags();
        this.searchMeals();
    }

    renderIngredientTags() {
        const container = document.getElementById('ingredientTags');
        container.innerHTML = this.ingredients.map(ingredient => `
            <span class="ingredient-tag">
                ${ingredient}
                <span class="remove" onclick="mealPlanner.removeIngredient('${ingredient}')">×</span>
            </span>
        `).join('');
    }

    searchMeals() {
        const suggestions = this.findMealsByIngredients(this.ingredients);
        this.renderSuggestions(suggestions);
    }

    findMealsByIngredients(ingredients) {
        if (ingredients.length === 0) {
            return this.getRandomMeals(6);
        }

        const matchedMeals = [];
        
        // 식자재 기반 검색
        for (const [category, meals] of Object.entries(this.mealDatabase)) {
            for (const meal of meals) {
                const matchCount = ingredients.filter(ing => 
                    meal.ingredients.some(mealIng => 
                        mealIng.toLowerCase().includes(ing.toLowerCase()) ||
                        ing.toLowerCase().includes(mealIng.toLowerCase())
                    )
                ).length;
                
                if (matchCount > 0) {
                    matchedMeals.push({
                        ...meal,
                        category,
                        matchCount,
                        matchedIngredients: ingredients.filter(ing => 
                            meal.ingredients.some(mealIng => 
                                mealIng.toLowerCase().includes(ing.toLowerCase()) ||
                                ing.toLowerCase().includes(mealIng.toLowerCase())
                            )
                        )
                    });
                }
            }
        }

        // 매치 수로 정렬
        matchedMeals.sort((a, b) => b.matchCount - a.matchCount);
        
        // 매치된 메뉴가 없으면 랜덤 추천
        return matchedMeals.length > 0 ? matchedMeals.slice(0, 8) : this.getRandomMeals(6);
    }

    getRandomMeals(count) {
        const allMeals = [];
        for (const [category, meals] of Object.entries(this.mealDatabase)) {
            meals.forEach(meal => allMeals.push({...meal, category}));
        }
        
        const shuffled = allMeals.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    renderSuggestions(suggestions) {
        const container = document.getElementById('suggestionList');
        
        if (suggestions.length === 0) {
            container.innerHTML = '<p>검색 결과가 없습니다. 다른 식자재를 입력해보세요!</p>';
            return;
        }

        container.innerHTML = suggestions.map(meal => `
            <div class="suggestion-item" onclick="mealPlanner.selectMeal('${meal.name}', '${meal.category}')">
                <h4>${meal.name}</h4>
                <p>${meal.description}</p>
                <div class="ingredients">재료: ${meal.ingredients.join(', ')}</div>
                ${meal.matchedIngredients ? `<div style="color: #667eea; font-weight: bold; margin-top: 5px;">매치: ${meal.matchedIngredients.join(', ')}</div>` : ''}
            </div>
        `).join('');
    }

    selectMeal(mealName, category) {
        if (!this.currentMealType || !this.currentDay) {
            this.showMessage('먼저 변경할 식사를 선택해주세요!', 'warning');
            return;
        }

        const mealKey = `${this.currentMealType}-${this.currentDay}`;
        this.mealPlan[mealKey] = mealName;
        this.renderMealPlan();
        this.showMessage(`${mealName}이(가) 선택되었습니다!`, 'success');
        
        // 선택 상태 초기화
        this.currentMealType = '';
        this.currentDay = '';
    }

    generateRandomMeals() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        
        days.forEach(day => {
            mealTypes.forEach(mealType => {
                const randomMeals = this.getRandomMeals(1);
                if (randomMeals.length > 0) {
                    const mealKey = `${mealType}-${day}`;
                    this.mealPlan[mealKey] = randomMeals[0].name;
                }
            });
        });
        
        this.renderMealPlan();
        this.showMessage('일주일 식단이 랜덤으로 생성되었습니다!', 'success');
    }

    clearAll() {
        if (confirm('모든 식단과 식자재를 초기화하시겠습니까?')) {
            this.ingredients = [];
            this.mealPlan = {};
            this.renderIngredientTags();
            this.renderMealPlan();
            this.renderSuggestions([]);
            this.showMessage('모든 데이터가 초기화되었습니다!', 'info');
        }
    }

    renderMealPlan() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        
        days.forEach(day => {
            mealTypes.forEach(mealType => {
                const mealKey = `${mealType}-${day}`;
                const element = document.querySelector(`[data-meal="${mealKey}"]`);
                if (element) {
                    const mealName = this.mealPlan[mealKey];
                    if (mealName) {
                        element.textContent = mealName;
                        element.classList.add('selected');
                    } else {
                        element.textContent = '메뉴를 선택해주세요';
                        element.classList.remove('selected');
                    }
                }
            });
        });
    }

    saveMealPlan() {
        localStorage.setItem('mealPlan', JSON.stringify(this.mealPlan));
        this.showMessage('식단이 저장되었습니다!', 'success');
    }

    loadMealPlan() {
        const saved = localStorage.getItem('mealPlan');
        this.mealPlan = saved ? JSON.parse(saved) : {};
        return this.mealPlan;
    }

    showMessage(message, type = 'info') {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        `;

        const colors = {
            success: '#4CAF50',
            warning: '#FF9800',
            info: '#2196F3',
            error: '#F44336'
        };
        messageEl.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 3000);
    }

    // 메뉴 데이터베이스
    mealDatabase = {
        breakfast: [
            { name: '김치볶음밥', description: '매콤한 김치와 밥의 조화', ingredients: ['김치', '밥', '계란', '파', '참기름'] },
            { name: '토스트', description: '바삭한 식빵과 다양한 토핑', ingredients: ['식빵', '버터', '잼', '치즈'] },
            { name: '계란후라이', description: '간단하고 영양가 있는 아침식사', ingredients: ['계란', '기름', '소금'] },
            { name: '오트밀', description: '건강한 곡물 아침식사', ingredients: ['오트밀', '우유', '과일', '견과류'] },
            { name: '샌드위치', description: '든든한 아침 샌드위치', ingredients: ['식빵', '햄', '치즈', '야채', '마요네즈'] },
            { name: '죽', description: '부드럽고 소화 잘되는 죽', ingredients: ['쌀', '물', '소금', '참기름'] },
            { name: '시리얼', description: '간편한 아침식사', ingredients: ['시리얼', '우유', '과일'] },
            { name: '팬케이크', description: '달콤한 아침 디저트', ingredients: ['밀가루', '계란', '우유', '설탕', '시럽'] }
        ],
        lunch: [
            { name: '불고기', description: '달콤짭짤한 한국 전통 요리', ingredients: ['소고기', '양파', '당근', '간장', '설탕', '마늘'] },
            { name: '김치찌개', description: '얼큰하고 시원한 국물요리', ingredients: ['김치', '돼지고기', '두부', '파', '고춧가루'] },
            { name: '된장찌개', description: '구수한 된장 국물', ingredients: ['된장', '두부', '감자', '양파', '호박', '멸치육수'] },
            { name: '비빔밥', description: '다양한 나물과 고추장의 조화', ingredients: ['밥', '나물', '고추장', '계란', '참기름'] },
            { name: '제육볶음', description: '매콤한 돼지고기 볶음', ingredients: ['돼지고기', '양파', '고추장', '마늘', '생강'] },
            { name: '닭갈비', description: '춘천 특산 매콤한 닭요리', ingredients: ['닭고기', '양배추', '고추장', '양파', '떡'] },
            { name: '갈비탕', description: '진한 국물의 보양식', ingredients: ['갈비', '무', '파', '마늘', '후추'] },
            { name: '삼겹살', description: '고소한 돼지고기 구이', ingredients: ['삼겹살', '마늘', '상추', '쌈장'] },
            { name: '치킨', description: '바삭한 튀김닭', ingredients: ['닭고기', '밀가루', '기름', '양념'] },
            { name: '파스타', description: '이탈리아 면요리', ingredients: ['면', '토마토소스', '마늘', '올리브오일', '치즈'] }
        ],
        dinner: [
            { name: '삼계탕', description: '몸보신에 좋은 닭요리', ingredients: ['닭', '인삼', '대추', '마늘', '찹쌀'] },
            { name: '해물탕', description: '시원한 해산물 국물', ingredients: ['새우', '조개', '오징어', '무', '미나리'] },
            { name: '갈치조림', description: '짭짤한 생선조림', ingredients: ['갈치', '무', '간장', '고춧가루', '마늘'] },
            { name: '떡볶이', description: '매콤달콤한 분식', ingredients: ['떡', '어묵', '양배추', '고추장', '설탕'] },
            { name: '순두부찌개', description: '부드러운 두부찌개', ingredients: ['순두부', '계란', '파', '고춧가루', '멸치육수'] },
            { name: 'bulgogi', description: 'Korean marinated beef', ingredients: ['beef', 'soy sauce', 'sugar', 'garlic', 'pear'] },
            { name: '스테이크', description: '육즙 가득한 소고기', ingredients: ['소고기', '소금', '후추', '마늘', '버터'] },
            { name: '연어구이', description: '건강한 생선요리', ingredients: ['연어', '레몬', '올리브오일', '허브', '소금'] },
            { name: '카레', description: '향신료 가득한 인도요리', ingredients: ['카레가루', '감자', '당근', '양파', '고기'] },
            { name: '마라탕', description: '얼얼한 중국 훠궈', ingredients: ['면', '야채', '고기', '마라소스', '두부'] }
        ]
    };
}

// 전역 함수들
function changeMeal(mealType, day) {
    mealPlanner.currentMealType = mealType;
    mealPlanner.currentDay = day;
    
    // 시각적 피드백
    document.querySelectorAll('.meal').forEach(meal => meal.classList.remove('selecting'));
    document.querySelector(`[data-meal="${mealType}-${day}"]`).parentElement.classList.add('selecting');
    
    mealPlanner.showMessage(`${getDayName(day)} ${getMealTypeName(mealType)} 메뉴를 선택해주세요!`, 'info');
    
    // 추천 메뉴 표시
    if (mealPlanner.ingredients.length === 0) {
        const suggestions = mealPlanner.getRandomMeals(6);
        mealPlanner.renderSuggestions(suggestions);
    }
}

function getDayName(day) {
    const dayNames = {
        monday: '월요일',
        tuesday: '화요일', 
        wednesday: '수요일',
        thursday: '목요일',
        friday: '금요일',
        saturday: '토요일',
        sunday: '일요일'
    };
    return dayNames[day] || day;
}

function getMealTypeName(mealType) {
    const mealTypeNames = {
        breakfast: '아침',
        lunch: '점심',
        dinner: '저녁'
    };
    return mealTypeNames[mealType] || mealType;
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .meal.selecting {
        background: #e3f2fd !important;
        border: 2px solid #667eea !important;
    }
`;
document.head.appendChild(style);

// 앱 초기화
const mealPlanner = new MealPlanner();
