class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    bindEvents() {
        // 할 일 추가
        document.getElementById('addBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // 필터 버튼들
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // 완료된 항목 삭제
        document.getElementById('clearCompleted').addEventListener('click', () => this.clearCompleted());
        
        // 모두 삭제
        document.getElementById('clearAll').addEventListener('click', () => this.clearAll());
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        
        if (!text) {
            this.showMessage('할 일을 입력해주세요!', 'warning');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toLocaleString('ko-KR')
        };

        this.todos.unshift(todo);
        input.value = '';
        this.saveTodos();
        this.render();
        this.updateStats();
        this.showMessage('할 일이 추가되었습니다!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    deleteTodo(id) {
        if (confirm('이 할 일을 삭제하시겠습니까?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showMessage('할 일이 삭제되었습니다!', 'info');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // 필터 버튼 활성화 상태 변경
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.render();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todoList.style.display = 'none';
            emptyState.classList.add('show');
            
            // 필터별 빈 상태 메시지 변경
            const emptyIcon = emptyState.querySelector('.empty-icon');
            const emptyText = emptyState.querySelectorAll('p');
            
            switch (this.currentFilter) {
                case 'active':
                    emptyIcon.textContent = '🎉';
                    emptyText[0].textContent = '진행중인 할 일이 없습니다!';
                    emptyText[1].textContent = '모든 할 일을 완료하셨네요!';
                    break;
                case 'completed':
                    emptyIcon.textContent = '📝';
                    emptyText[0].textContent = '완료된 할 일이 없습니다.';
                    emptyText[1].textContent = '할 일을 완료해보세요!';
                    break;
                default:
                    emptyIcon.textContent = '📋';
                    emptyText[0].textContent = '아직 할 일이 없습니다.';
                    emptyText[1].textContent = '위에서 새로운 할 일을 추가해보세요!';
            }
        } else {
            todoList.style.display = 'block';
            emptyState.classList.remove('show');
            
            todoList.innerHTML = filteredTodos.map(todo => `
                <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                         onclick="todoApp.toggleTodo(${todo.id})"></div>
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    <span class="todo-date">${todo.createdAt}</span>
                    <button class="delete-btn" onclick="todoApp.deleteTodo(${todo.id})">×</button>
                </li>
            `).join('');
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const active = total - completed;

        document.getElementById('totalCount').textContent = `총 ${total}개`;
        document.getElementById('completedCount').textContent = `완료 ${completed}개`;
        document.getElementById('activeCount').textContent = `진행중 ${active}개`;
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showMessage('완료된 할 일이 없습니다!', 'info');
            return;
        }

        if (confirm(`완료된 ${completedCount}개의 할 일을 삭제하시겠습니까?`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showMessage('완료된 할 일이 삭제되었습니다!', 'success');
        }
    }

    clearAll() {
        if (this.todos.length === 0) {
            this.showMessage('삭제할 할 일이 없습니다!', 'info');
            return;
        }

        if (confirm('모든 할 일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            this.todos = [];
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showMessage('모든 할 일이 삭제되었습니다!', 'info');
        }
    }

    showMessage(message, type = 'info') {
        // 기존 메시지가 있다면 제거
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

        // 타입별 배경색 설정
        const colors = {
            success: '#4CAF50',
            warning: '#FF9800',
            info: '#2196F3',
            error: '#F44336'
        };
        messageEl.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(messageEl);

        // 3초 후 자동 제거
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadTodos() {
        const saved = localStorage.getItem('todos');
        return saved ? JSON.parse(saved) : [];
    }
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
`;
document.head.appendChild(style);

// 앱 초기화
const todoApp = new TodoApp();
