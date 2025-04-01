const taskManager = {
  // state variables
  tasks: JSON.parse(localStorage.getItem("tasks")) || [
    { id: 1, name: "Finish project", priority: "high", dueDate: "2025-1-01" },
    { id: 2, name: "Buy groceries", priority: "medium", dueDate: "2025-1-5" },
    { id: 3, name: "Call mom", priority: "low", dueDate: "2025-1-4" },
    { id: 4, name: "Study", priority: "high", dueDate: "2025-1-2" }
  ],
  history: [],      
  future: [],       
  currentState: 0,  
  MAX_HISTORY: 50,  

  // initialize application
  init() {
    // save initial state
    this.history = [JSON.stringify(this.tasks)];
    this.setupEventListeners();
    this.renderTasks();
  },

  // CORE FUNCTIONS
  
  // save tasks to localstorage
  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  },

  // take snapshot of current state for undo/redo
  captureState() {
    const currentState = JSON.stringify(this.tasks);
    if (this.history.length > 0 && currentState === this.history[this.history.length - 1]) {
      return;
    }
    
    this.history.push(currentState);
    this.future = []; // Clear redo stack on new action
    
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    }
  },

  // UNDO/REDO SYSTEM
  
  // revert to previous state
  undo() {
    if (this.history.length > 1) { // Always keep initial state
      // move current state to redo stack
      const currentState = this.history.pop();
      this.future.push(currentState);
      
      // restore previous state
      this.tasks = JSON.parse(this.history[this.history.length - 1]);
      this.saveTasks();
      this.renderTasks();
      this.showToast(`Undo (${this.history.length - 1}/${this.MAX_HISTORY})`);
    } else {
      this.showToast("Nothing to undo", "bg-red-500");
    }
  },

  // reapply previously undone action
  redo() {
    if (this.future.length > 0) {
      // get next state from redo stack
      const nextState = this.future.pop();
      this.history.push(nextState);
      
      // apply the state
      this.tasks = JSON.parse(nextState);
      this.saveTasks();
      this.renderTasks();
      this.showToast(`Redo (${this.future.length} left)`);
    } else {
      this.showToast("Nothing to redo", "bg-red-500");
    }
  },

  // UI FUNCTIONS
  
  // show temporary notifs message
  showToast(message, bgColor = "bg-green-500") {
    const toast = document.createElement("div");
    toast.className = `toast ${bgColor} text-white px-4 py-2 rounded shadow-lg flex items-center`;
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      ${message}
    `;
    document.getElementById("toast-container").appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  // render all tasks to the DOM
  renderTasks() {
    const taskList = document.getElementById("task-list");
    const emptyState = document.getElementById("empty-state");
    
    taskList.innerHTML = "";
    
    if (this.tasks.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }
    
    emptyState.classList.add("hidden");

    this.tasks.forEach(task => {
      const priorityColors = {
        high: "text-red-600 font-bold",
        medium: "text-orange-500 font-bold",
        low: "text-green-600 font-bold"
      };

      const taskItem = document.createElement("li");
      taskItem.className = "task-item p-3 border border-gray-200 rounded flex justify-between items-center bg-white hover:shadow-sm transition-shadow";
      taskItem.setAttribute("data-id", task.id);
      taskItem.setAttribute("draggable", "true");
      taskItem.innerHTML = `
        <div class="flex items-center gap-4 flex-wrap">
          <span class="name font-medium">${task.name}</span>
          <span class="${priorityColors[task.priority]}">${task.priority}</span>
          <span class="text-gray-500 text-sm">${this.formatDate(task.dueDate)}</span>
        </div>
        <button class="delete-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
          data-id="${task.id}" aria-label="Delete task">
          Delete
        </button>
      `;
      taskList.appendChild(taskItem);

      taskItem.addEventListener("dblclick", () => this.enableEditMode(taskItem, task));
    });

    this.setupDragAndDrop();
  },

  // format date for display
  formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  },

  // TASK OPERATIONS
  
  // enable inline editing for a task
  enableEditMode(li, task) {
    this.captureState();
    
    li.classList.add("editing");
    li.innerHTML = `
      <div class="flex items-center gap-2 w-full flex-wrap">
        <input class="edit-input p-2 border border-gray-300 rounded flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          value="${task.name}" data-field="name" aria-label="Task name">
        <select class="edit-input p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          data-field="priority" aria-label="Task priority">
          <option value="low" ${task.priority === "low" ? "selected" : ""}>Low</option>
          <option value="medium" ${task.priority === "medium" ? "selected" : ""}>Medium</option>
          <option value="high" ${task.priority === "high" ? "selected" : ""}>High</option>
        </select>
        <input type="date" class="edit-input p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          value="${task.dueDate}" data-field="dueDate" aria-label="Due date">
        <div class="flex gap-2">
          <button class="save-edit bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors" type="button">
            Save
          </button>
          <button class="cancel-edit bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors" type="button">
            Cancel
          </button>
        </div>
      </div>
    `;

    const saveEdit = () => {
      li.querySelectorAll(".edit-input").forEach(input => {
        task[input.getAttribute("data-field")] = input.value;
      });
      this.saveTasks();
      this.renderTasks();
      this.showToast("Task updated");
    };

    li.querySelector(".save-edit").addEventListener("click", saveEdit);
    li.querySelector(".cancel-edit").addEventListener("click", () => this.renderTasks());
    
    li.querySelectorAll(".edit-input").forEach(input => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") saveEdit();
      });
    });
  },

  // DRAG AND DROP
  
  // setup drag and drop event listeners
  setupDragAndDrop() {
    let draggedItem = null;

    document.querySelectorAll(".task-item").forEach(item => {
      item.addEventListener("dragstart", () => {
        draggedItem = item;
        setTimeout(() => item.classList.add("dragging"), 0);
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
      });
    });

    const taskList = document.getElementById("task-list");
    
    taskList.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = this.getDragAfterElement(taskList, e.clientY);
      if (afterElement == null) {
        taskList.appendChild(draggedItem);
      } else {
        taskList.insertBefore(draggedItem, afterElement);
      }
    });

    taskList.addEventListener("drop", () => {
      this.captureState();
      
      const newTasks = [];
      document.querySelectorAll(".task-item").forEach(item => {
        const id = parseInt(item.getAttribute("data-id"));
        newTasks.push(this.tasks.find(t => t.id === id));
      });
      this.tasks = newTasks;
      this.saveTasks();
      this.showToast("Tasks reordered");
    });
  },

  // calculate drop position during drag
  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".task-item:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  },

  // EVENT HANDLERS
  
  // handle new task form submission
  handleTaskSubmit(e) {
    e.preventDefault();
    this.captureState();
    
    const newTask = {
      id: Date.now(),
      name: document.getElementById("task-name").value.trim(),
      priority: document.getElementById("task-priority").value,
      dueDate: document.getElementById("task-due").value
    };
    
    if (!newTask.name) {
      this.showToast("Task name cannot be empty", "bg-red-500");
      return;
    }
    
    this.tasks.push(newTask);
    this.saveTasks();
    this.renderTasks();
    document.getElementById("task-form").reset();
    document.getElementById("task-name").focus();
    this.showToast("Task added successfully");
  },

  // handle task deletion
  handleDeleteClick(e) {
    this.captureState();
    
    const taskId = parseInt(e.target.getAttribute("data-id"));
    const taskName = this.tasks.find(t => t.id === taskId)?.name || "Task";
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    this.saveTasks();
    this.renderTasks();
    this.showToast(`Deleted: ${taskName}`, "bg-red-500");
  },

  // sort tasks by priority
  handleSortPriority() {
    this.captureState();
    
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    this.tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    this.saveTasks();
    this.renderTasks();
    this.showToast("Sorted by priority");
  },

  // sort tasks by due date
  handleSortDate() {
    this.captureState();
    
    this.tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    this.saveTasks();
    this.renderTasks();
    this.showToast("Sorted by date");
  },

  // sort tasks alphabetically
  handleSortName() {
    this.captureState();
    
    this.tasks.sort((a, b) => a.name.localeCompare(b.name));
    this.saveTasks();
    this.renderTasks();
    this.showToast("Sorted by name");
  },

  // EVENT LISTENERS
  
  // attach all event listeners
  setupEventListeners() {
    document.getElementById("task-form").addEventListener("submit", (e) => this.handleTaskSubmit(e)); //FIGURE OUT ERROR: 'cannot read properties of null'
    
    document.getElementById("task-list").addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        this.handleDeleteClick(e);
      }
    });

    document.getElementById("sort-priority").addEventListener("click", () => this.handleSortPriority());
    document.getElementById("sort-date").addEventListener("click", () => this.handleSortDate());
    document.getElementById("sort-name").addEventListener("click", () => this.handleSortName());

    document.getElementById("undo-btn").addEventListener("click", () => this.undo());
    document.getElementById("redo-btn").addEventListener("click", () => this.redo());

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        this.undo();
      }
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        this.redo();
      }
    });
  }
};

// start the application
taskManager.init();