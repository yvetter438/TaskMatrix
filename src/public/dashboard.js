// Dashboard JavaScript for Google Tasks Eisenhower Matrix

class TaskManager {
	constructor() {
		this.taskLists = [];
		this.allTasks = [];
		this.currentTaskList = null;
		this.modal = document.getElementById('task-modal');
		this.form = document.getElementById('task-form');
		this.selectedListFilters = new Set(); // Track which lists are selected for filtering
		
		this.init();
	}

	async init() {
		await this.loadTaskLists();
		this.setupEventListeners();
		await this.loadTasks();
		// Setup drag and drop AFTER tasks are loaded
		this.setupDragAndDrop();
	}

	setupEventListeners() {
		// Refresh button
		document.getElementById('refresh-tasks').addEventListener('click', () => {
			this.loadTasks();
		});

		// Clear completed button
		document.getElementById('clear-completed').addEventListener('click', () => {
			this.clearCompletedTasks();
		});

		// Add task button
		document.getElementById('add-task').addEventListener('click', () => {
			this.openTaskModal();
		});

		// Modal controls
		document.querySelector('.close').addEventListener('click', () => {
			this.closeModal();
		});

		document.getElementById('cancel-task').addEventListener('click', () => {
			this.closeModal();
		});

		// Form submission
		this.form.addEventListener('submit', (e) => {
			e.preventDefault();
			this.saveTask();
		});

		// Close modal on outside click
		window.addEventListener('click', (e) => {
			if (e.target === this.modal) {
				this.closeModal();
			}
		});

		// Drag and drop setup moved to after tasks are loaded
	}

	setupDragAndDrop() {
		console.log('=== DRAG & DROP SETUP TESTING ===');
		
		// Test 1: Check if quadrants exist
		const quadrants = document.querySelectorAll('.task-list');
		console.log('Test 1 - Found quadrants:', quadrants.length);
		quadrants.forEach((q, i) => {
			console.log(`  Quadrant ${i}: class="${q.className}", category="${q.dataset.category}"`);
		});
		
		// Test 2: Check if tasks exist and are draggable
		const tasks = document.querySelectorAll('.task-item');
		console.log('Test 2 - Found tasks:', tasks.length);
		tasks.forEach((t, i) => {
			console.log(`  Task ${i}: draggable="${t.draggable}", taskId="${t.dataset.taskId}"`);
		});
		
		// Use event delegation with better quadrant detection
		document.addEventListener('dragover', (e) => {
			// Check if we're over a quadrant or its children
			const quadrant = e.target.closest('.task-list') || e.target.closest('.quadrant');
			if (quadrant) {
				e.preventDefault();
				e.stopPropagation();
				e.dataTransfer.dropEffect = 'move';
				// Find the actual task-list container within the quadrant
				const taskList = quadrant.querySelector('.task-list') || quadrant;
				taskList.classList.add('drag-over');
				console.log('✅ Drag over quadrant:', taskList.dataset.category);
			} else {
				console.log('❌ Drag over - no quadrant found, target:', e.target.className, e.target.tagName);
			}
		});

		document.addEventListener('dragenter', (e) => {
			const quadrant = e.target.closest('.task-list') || e.target.closest('.quadrant');
			if (quadrant) {
				e.preventDefault();
				e.stopPropagation();
				const taskList = quadrant.querySelector('.task-list') || quadrant;
				console.log('✅ Drag enter quadrant:', taskList.dataset.category);
			} else {
				console.log('❌ Drag enter - no quadrant found, target:', e.target.className);
			}
		});

		document.addEventListener('dragleave', (e) => {
			const quadrant = e.target.closest('.task-list') || e.target.closest('.quadrant');
			if (quadrant && !quadrant.contains(e.relatedTarget)) {
				e.preventDefault();
				e.stopPropagation();
				const taskList = quadrant.querySelector('.task-list') || quadrant;
				taskList.classList.remove('drag-over');
				console.log('✅ Drag leave quadrant:', taskList.dataset.category);
			}
		});

		document.addEventListener('drop', (e) => {
			const quadrant = e.target.closest('.task-list') || e.target.closest('.quadrant');
			if (quadrant) {
				e.preventDefault();
				e.stopPropagation();
				const taskList = quadrant.querySelector('.task-list') || quadrant;
				taskList.classList.remove('drag-over');
				
				const taskId = e.dataTransfer.getData('text/plain');
				const category = taskList.dataset.category;
				
				console.log('✅ Drop event - taskId:', taskId, 'category:', category);
				
				// Move task to this quadrant
				this.moveTaskToCategory(taskId, category);
			} else {
				console.log('❌ Drop - no quadrant found, target:', e.target.className);
			}
		});

		// Close dropdowns when clicking outside
		document.addEventListener('click', (e) => {
			if (!e.target.closest('.task-menu')) {
				document.querySelectorAll('.task-dropdown').forEach(dropdown => {
					dropdown.classList.remove('show');
				});
			}
		});

		// Close dropdowns when pressing Escape key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				this.closeAllDropdowns();
			}
		});

		// Setup hover-to-close functionality
		this.setupTaskHoverClose();

		// Setup filter functionality
		this.setupFilters();

		// Setup keyboard shortcuts
		this.setupKeyboardShortcuts();

		console.log('=== DRAG & DROP SETUP COMPLETE ===');
	}

	async loadTaskLists() {
		try {
			const response = await fetch('/tasks/lists');
			const data = await response.json();
			this.taskLists = data.items || [];
		} catch (error) {
			console.error('Error loading task lists:', error);
		}
	}

	async loadTasks(showLoading = true) {
		if (showLoading) {
			this.setRefreshLoading(true);
		}

		try {
			if (this.taskLists.length === 0) {
				await this.loadTaskLists();
			}

			this.allTasks = [];
			
			// Load tasks from all lists
			for (const list of this.taskLists) {
				try {
					const response = await fetch(`/tasks/${list.id}`);
					const data = await response.json();
					if (data.items) {
						this.allTasks.push(...data.items.map(task => ({
							...task,
							listId: list.id,
							listTitle: list.title
						})));
					}
				} catch (error) {
					console.error(`Error loading tasks from list ${list.title}:`, error);
				}
			}

			// Sort tasks by due date (earliest first)
			this.sortTasksByDueDate();

			this.renderAllTasks();
			this.renderMatrix();
		} finally {
			if (showLoading) {
				this.setRefreshLoading(false);
			}
		}
	}


	renderAllTasks() {
		const container = document.getElementById('all-tasks-container');
		container.innerHTML = '';

		// Get tasks that are already in the matrix
		const matrixTaskIds = new Set();
		document.querySelectorAll('.task-list').forEach(quadrant => {
			Array.from(quadrant.children).forEach(task => {
				matrixTaskIds.add(task.dataset.taskId);
			});
		});

		// Get cleared completed tasks from localStorage
		const clearedCompletedTasks = this.getClearedCompletedTasks();

		// Filter and show tasks
		this.allTasks.forEach(task => {
			// Skip if task is in matrix or cleared completed
			if (matrixTaskIds.has(task.id) || clearedCompletedTasks.has(task.id)) {
				return;
			}

			// Apply list filter if any lists are selected
			if (this.selectedListFilters.size > 0 && !this.selectedListFilters.has(task.listId)) {
				return;
			}

			const taskElement = this.createTaskElement(task);
			container.appendChild(taskElement);
		});
	}

	renderMatrix() {
		// Clear all quadrants - let user drag tasks manually
		document.querySelectorAll('.task-list').forEach(quadrant => {
			quadrant.innerHTML = '';
		});

		// Load tasks from localStorage if they exist
		const savedMatrix = localStorage.getItem('taskMatrix');
		if (savedMatrix) {
			const matrixData = JSON.parse(savedMatrix);
			Object.keys(matrixData).forEach(category => {
				const quadrantElement = document.querySelector(`[data-category="${category}"]`);
				
				// Get tasks for this quadrant and sort them by due date
				const quadrantTasks = matrixData[category]
					.map(taskId => this.allTasks.find(t => t.id === taskId))
					.filter(task => {
						if (!task) return false;
						// Apply list filter
						if (this.selectedListFilters.size > 0 && !this.selectedListFilters.has(task.listId)) {
							return false;
						}
						return true;
					})
					.sort((a, b) => {
						// Sort by due date (earliest first), same logic as sortTasksByDueDate
						if (!a.due && !b.due) return 0;
						if (!a.due) return 1;
						if (!b.due) return -1;
						return new Date(a.due) - new Date(b.due);
					});
				
				// Add sorted tasks to quadrant
				quadrantTasks.forEach(task => {
					const taskElement = this.createTaskElement(task, true);
					quadrantElement.appendChild(taskElement);
				});
			});
		}

		// Re-render all tasks to hide those in matrix
		this.renderAllTasks();
	}

	createTaskElement(task, isMatrix = false) {
		const element = document.createElement('div');
		
		// Check if task is overdue
		const isOverdue = task.due && new Date(task.due) < new Date() && task.status !== 'completed';
		
		element.className = `task-item ${task.status === 'completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
		element.draggable = true;
		element.dataset.taskId = task.id;
		element.dataset.listId = task.listId;

		const dueDate = task.due ? new Date(task.due).toLocaleDateString() : '';
		const notes = task.notes ? ` - ${task.notes.substring(0, 50)}...` : '';

		// Create different dropdown options based on whether task is in matrix
		const dropdownItems = `
			<button class="task-dropdown-item" onclick="taskManager.editTask('${task.id}', '${task.listId}')">Edit</button>
			${isMatrix ? `<button class="task-dropdown-item" onclick="taskManager.removeFromMatrix('${task.id}')">Remove from Matrix</button>` : ''}
			<button class="task-dropdown-item delete" onclick="taskManager.deleteTask('${task.id}', '${task.listId}')">Delete</button>
		`;

		element.innerHTML = `
			<div class="task-content">
				<div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" onclick="taskManager.toggleTaskComplete('${task.id}', '${task.listId}')"></div>
				<div class="task-details">
					<div class="task-title">${task.title}</div>
					<div class="task-meta">
						${task.listTitle ? `<span class="task-list-name">${task.listTitle}</span>` : ''}
						${dueDate ? `<span class="task-due">Due: ${dueDate}</span>` : ''}
						${notes}
					</div>
				</div>
			</div>
			<div class="task-menu">
				<button class="task-menu-button" onclick="taskManager.toggleTaskMenu('${task.id}')"></button>
				<div class="task-dropdown" id="menu-${task.id}">
					${dropdownItems}
				</div>
			</div>
		`;

		// Add drag and drop event listeners
		element.addEventListener('dragstart', (e) => {
			console.log('=== DRAG START TEST ===');
			console.log('Task ID:', task.id);
			console.log('Element draggable:', element.draggable);
			console.log('DataTransfer types before:', e.dataTransfer.types);
			
			e.dataTransfer.setData('text/plain', task.id);
			e.dataTransfer.effectAllowed = 'move';
			element.classList.add('dragging');
			
			console.log('DataTransfer types after:', e.dataTransfer.types);
			console.log('✅ Drag start - taskId:', task.id);
		});

		element.addEventListener('dragend', () => {
			element.classList.remove('dragging');
			console.log('✅ Drag end - taskId:', task.id);
		});

		return element;
	}

	openTaskModal(task = null) {
		document.getElementById('modal-title').textContent = task ? 'Edit Task' : 'Add Task';
		document.getElementById('task-id').value = task ? task.id : '';
		
		// Populate task list dropdown
		const listSelect = document.getElementById('task-list-id');
		listSelect.innerHTML = '<option value="">Select a list...</option>';
		this.taskLists.forEach(list => {
			const option = document.createElement('option');
			option.value = list.id;
			option.textContent = list.title;
			listSelect.appendChild(option);
		});
		
		// Set selected list
		listSelect.value = task ? task.listId : (this.taskLists[0]?.id || '');
		
		document.getElementById('task-title').value = task ? task.title : '';
		document.getElementById('task-notes').value = task ? (task.notes || '') : '';
		document.getElementById('task-due').value = task && task.due ? 
			new Date(task.due).toISOString().slice(0, 10) : '';

		this.modal.style.display = 'block';
	}

	closeModal() {
		this.modal.style.display = 'none';
		this.form.reset();
	}

	async saveTask() {
		const taskId = document.getElementById('task-id').value;
		const listId = document.getElementById('task-list-id').value;
		const title = document.getElementById('task-title').value;
		const notes = document.getElementById('task-notes').value;
		const due = document.getElementById('task-due').value;

		// Convert date to RFC 3339 format (date only, no time)
		const taskData = {
			title,
			notes,
			due: due ? new Date(due + 'T00:00:00').toISOString() : null
		};

		try {
			let response;
			if (taskId) {
				// Update existing task
				response = await fetch(`/tasks/${listId}/${taskId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(taskData)
				});
			} else {
				// Create new task
				response = await fetch(`/tasks/${listId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(taskData)
				});
			}

			if (response.ok) {
				this.closeModal();
				this.loadTasks();
			} else {
				alert('Error saving task');
			}
		} catch (error) {
			console.error('Error saving task:', error);
			alert('Error saving task');
		}
	}

	toggleTaskComplete(taskId, listId) {
		const task = this.allTasks.find(t => t.id === taskId);
		if (!task) return;

		if (task.status === 'completed') {
			this.uncompleteTask(taskId, listId);
		} else {
			this.completeTask(taskId, listId);
		}
	}

	async completeTask(taskId, listId) {
		try {
			const response = await fetch(`/tasks/${listId}/${taskId}/complete`, {
				method: 'POST'
			});
			if (response.ok) {
				// Update local task status
				const task = this.allTasks.find(t => t.id === taskId);
				if (task) task.status = 'completed';
				
				// Update UI
				const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
				if (taskElement) {
					taskElement.classList.add('completed');
					const checkbox = taskElement.querySelector('.task-checkbox');
					if (checkbox) checkbox.classList.add('checked');
				}
			}
		} catch (error) {
			console.error('Error completing task:', error);
		}
	}

	async uncompleteTask(taskId, listId) {
		try {
			const response = await fetch(`/tasks/${listId}/${taskId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'needsAction' })
			});
			if (response.ok) {
				// Update local task status
				const task = this.allTasks.find(t => t.id === taskId);
				if (task) task.status = 'needsAction';
				
				// Update UI
				const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
				if (taskElement) {
					taskElement.classList.remove('completed');
					const checkbox = taskElement.querySelector('.task-checkbox');
					if (checkbox) checkbox.classList.remove('checked');
				}
			}
		} catch (error) {
			console.error('Error uncompleting task:', error);
		}
	}

	toggleTaskMenu(taskId) {
		// Close all other dropdowns first (ensures only one is open)
		this.closeAllDropdowns();

		// Then toggle the current dropdown
		const dropdown = document.getElementById(`menu-${taskId}`);
		if (dropdown) {
			dropdown.classList.add('show');
		}
	}

	// Close dropdown when hovering over any task item
	setupTaskHoverClose() {
		document.addEventListener('mouseover', (e) => {
			const taskItem = e.target.closest('.task-item');
			if (taskItem && !taskItem.querySelector('.task-dropdown.show')) {
				// Hovering over a task that doesn't have its own dropdown open
				this.closeAllDropdowns();
			}
		});
	}

	closeAllDropdowns() {
		document.querySelectorAll('.task-dropdown').forEach(dropdown => {
			dropdown.classList.remove('show');
		});
	}

	moveTaskToCategory(taskId, category) {
		console.log('moveTaskToCategory called - taskId:', taskId, 'category:', category);
		
		// Remove task from current location (either matrix or all-tasks)
		const currentElement = document.querySelector(`[data-task-id="${taskId}"]`);
		if (currentElement) {
			console.log('Removing task from current location');
			currentElement.remove();
		}

		// Add task to new quadrant
		const task = this.allTasks.find(t => t.id === taskId);
		if (task) {
			const newQuadrant = document.querySelector(`[data-category="${category}"]`);
			if (newQuadrant) {
				console.log('Adding task to quadrant:', category);
				const taskElement = this.createTaskElement(task, true);
				newQuadrant.appendChild(taskElement);

				// Save to localStorage
				this.saveMatrixToStorage();

				// Update the "All Tasks" section to hide this task
				this.renderAllTasks();
			} else {
				console.error('Could not find quadrant with category:', category);
			}
		} else {
			console.error('Could not find task with id:', taskId);
		}
	}

	saveMatrixToStorage() {
		const matrixData = {};
		document.querySelectorAll('.task-list').forEach(quadrant => {
			const category = quadrant.dataset.category;
			const taskIds = Array.from(quadrant.children).map(task => task.dataset.taskId);
			matrixData[category] = taskIds;
		});
		localStorage.setItem('taskMatrix', JSON.stringify(matrixData));
	}

	removeFromMatrix(taskId) {
		// Remove task from current quadrant
		const currentElement = document.querySelector(`[data-task-id="${taskId}"]`);
		if (currentElement) {
			currentElement.remove();
		}

		// Save updated matrix to localStorage
		this.saveMatrixToStorage();

		// Re-render all tasks to show this task again
		this.renderAllTasks();
	}

	editTask(taskId, listId) {
		const task = this.allTasks.find(t => t.id === taskId);
		if (task) {
			this.openTaskModal(task);
		}
	}

	async deleteTask(taskId, listId) {
		if (confirm('Are you sure you want to delete this task?')) {
			try {
				const response = await fetch(`/tasks/${listId}/${taskId}`, {
					method: 'DELETE'
				});
				if (response.ok) {
					this.loadTasks();
				}
			} catch (error) {
				console.error('Error deleting task:', error);
			}
		}
	}

	async clearCompletedTasks() {
		// Simply remove completed tasks from matrix - they stay completed in Google Tasks
		const completedTasksInMatrix = document.querySelectorAll('.task-item.completed').length;
		
		if (completedTasksInMatrix === 0) {
			return; // No completed tasks to clear
		}

		// Show loading state
		this.setClearCompletedLoading(true);

		try {
			// Small delay to show loading state
			await new Promise(resolve => setTimeout(resolve, 300));

			// Collect completed task IDs and add them to cleared list
			const completedTaskIds = [];
			document.querySelectorAll('.task-item.completed').forEach(taskElement => {
				completedTaskIds.push(taskElement.dataset.taskId);
				taskElement.remove();
			});

			// Add completed tasks to cleared list so they don't reappear on refresh
			this.addToClearedCompletedTasks(completedTaskIds);

			// Save updated matrix to localStorage
			this.saveMatrixToStorage();

			// Re-render all tasks to show the cleaned state
			this.renderAllTasks();
		} finally {
			// Hide loading state
			this.setClearCompletedLoading(false);
		}
	}

	getClearedCompletedTasks() {
		const cleared = localStorage.getItem('clearedCompletedTasks');
		return cleared ? new Set(JSON.parse(cleared)) : new Set();
	}

	addToClearedCompletedTasks(taskIds) {
		const cleared = this.getClearedCompletedTasks();
		taskIds.forEach(id => cleared.add(id));
		localStorage.setItem('clearedCompletedTasks', JSON.stringify([...cleared]));
	}

	sortTasksByDueDate() {
		this.allTasks.sort((a, b) => {
			// Tasks without due dates go to the end
			if (!a.due && !b.due) return 0;
			if (!a.due) return 1;
			if (!b.due) return -1;
			
			// Sort by due date (earliest first)
			return new Date(a.due) - new Date(b.due);
		});
	}

	toggleListFilter(listId) {
		if (this.selectedListFilters.has(listId)) {
			this.selectedListFilters.delete(listId);
		} else {
			this.selectedListFilters.add(listId);
		}
		
		// Re-render both all tasks and matrix with new filter
		this.renderAllTasks();
		this.renderMatrix();
	}

	clearAllFilters() {
		this.selectedListFilters.clear();
		this.renderAllTasks();
		this.renderMatrix();
	}

	setupFilters() {
		// Toggle filter dropdown
		document.getElementById('toggle-filters').addEventListener('click', () => {
			const dropdown = document.getElementById('filter-dropdown');
			dropdown.classList.toggle('show');
			this.populateFilterList();
		});

		// Clear all filters
		document.getElementById('clear-filters').addEventListener('click', () => {
			this.clearAllFilters();
		});

		// Close filter dropdown when clicking outside
		document.addEventListener('click', (e) => {
			if (!e.target.closest('.filter-section')) {
				document.getElementById('filter-dropdown').classList.remove('show');
			}
		});
	}

	populateFilterList() {
		const container = document.getElementById('list-filters');
		container.innerHTML = '';

		this.taskLists.forEach(list => {
			const checkbox = document.createElement('div');
			checkbox.className = 'filter-checkbox';
			checkbox.innerHTML = `
				<input type="checkbox" id="filter-${list.id}" ${this.selectedListFilters.has(list.id) ? 'checked' : ''}>
				<label for="filter-${list.id}">${list.title}</label>
			`;

			checkbox.addEventListener('click', () => {
				this.toggleListFilter(list.id);
				this.populateFilterList(); // Refresh to show updated state
			});

			container.appendChild(checkbox);
		});
	}

	setupKeyboardShortcuts() {
		document.addEventListener('keydown', (e) => {
			// Don't trigger shortcuts when typing in inputs
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
				return;
			}

			// Don't trigger if modal is open (except ESC)
			if (this.modal.style.display === 'block' && e.key !== 'Escape') {
				return;
			}

			switch(e.key.toLowerCase()) {
				case 'n':
					// New task
					e.preventDefault();
					this.openTaskModal();
					break;
				case 'r':
					// Refresh tasks
					e.preventDefault();
					this.loadTasks();
					break;
				case 'f':
					// Toggle filters
					e.preventDefault();
					const dropdown = document.getElementById('filter-dropdown');
					dropdown.classList.toggle('show');
					if (dropdown.classList.contains('show')) {
						this.populateFilterList();
					}
					break;
				case 'c':
					// Clear completed tasks
					if (e.shiftKey) {
						e.preventDefault();
						this.clearCompletedTasks();
					}
					break;
				case '?':
					// Show help
					e.preventDefault();
					this.toggleHelp();
					break;
			}
		});
	}

	toggleHelp() {
		const helpModal = document.getElementById('help-modal');
		if (helpModal.style.display === 'block') {
			helpModal.style.display = 'none';
		} else {
			helpModal.style.display = 'block';
		}
	}

	setRefreshLoading(isLoading) {
		const refreshButton = document.getElementById('refresh-tasks');
		
		if (isLoading) {
			refreshButton.disabled = true;
			refreshButton.innerHTML = `
				<span class="loading-spinner"></span>
				Refreshing...
			`;
			refreshButton.classList.add('loading');
		} else {
			refreshButton.disabled = false;
			refreshButton.innerHTML = 'Refresh Tasks';
			refreshButton.classList.remove('loading');
		}
	}

	setClearCompletedLoading(isLoading) {
		const clearButton = document.getElementById('clear-completed');
		
		if (isLoading) {
			clearButton.disabled = true;
			clearButton.innerHTML = `
				<span class="loading-spinner"></span>
				Clearing...
			`;
			clearButton.classList.add('loading');
		} else {
			clearButton.disabled = false;
			clearButton.innerHTML = 'Clear Completed';
			clearButton.classList.remove('loading');
		}
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	window.taskManager = new TaskManager();
});
