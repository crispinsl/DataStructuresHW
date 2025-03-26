// ====================
// STATE MANAGEMENT
// ====================
const taskManager = {
  tasks: JSON.parse(localStorage.getItem("tasks")) || [
    { id: 1, name: "Finish project", priority: "high", dueDate: "2023-12-01" },
    { id: 2, name: "Buy groceries", priority: "medium", dueDate: "2023-11-25" },
    { id: 3, name: "Call mom", priority: "low", dueDate: "2023-11-20" }
  ],
  history: [],
  future: [],
  MAX_HISTORY: 20,
  
  // Initialize the app
  init() {
    this.saveSnapshot();
    this.setupEventListeners();
    this.renderTasks();
  },

  // ====================
  // CORE FUNCTIONS
  // ====================
  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  },

  saveSnapshot() {
    this.history.push(JSON.stringify(this.tasks));
    this.future = [];
    if (this.history.length > this.MAX_HISTORY) this.history.shift();
  },

  // ====================
  // UNDO/REDO SYSTEM
  // ====================
  undo() {
    if (this.history.length > 1) {
      this.future.push(this.history.pop());
      this.tasks = JSON.parse(this.history[this.history.length - 1]);
      this.saveTasks();
      this.renderTasks();
      this.showToast("Undo successful");
    } else {
      this.showToast("Nothing to undo", "bg-red-500");
    }
  },

  redo() {
    if (this.future.length > 0) {
      const nextState = this.future.pop();
      this.history.push(nextState);
      this.tasks = JSON.parse(nextState);
      this.saveTasks();
      this.renderTasks();
      this.showToast("Redo successful");
    } else {
      this.showToast("Nothing to redo", "bg-red-500");
    }
  },

  // ====================
  // UI FUNCTIONS
  // ====================
  showToast(message, bgColor = "bg-green-500") {
    const toast = document.createElement("div");
    toast.className = `toast ${bgColor} text-white px-4 py-2 rounded shadow-lg`;
    toast.textContent = message;
    document.getElementById("toast-container").appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

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
      taskItem.className = "task-item p-3 border border-gray-200 rounded flex justify-between items-center";
      taskItem.setAttribute("data-id", task.id);
      taskItem.setAttribute("draggable", "true");
      taskItem.innerHTML = `
        <div class="flex items-center gap-4">
          <span class="name">${task.name}</span>
          <span class="${priorityColors[task.priority]}">${task.priority}</span>
          <span class="text-gray-500">Due: ${this.formatDate(task.dueDate)}</span>
        </div>
        <button 
          class="delete-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
          data-id="${task.id}"
        >
          Delete
        </button>
      `;
      taskList.appendChild(taskItem);

      taskItem.addEventListener("dblclick", () => this.enableEditMode(taskItem, task));
    });

    this.setupDragAndDrop();
    this.saveSnapshot();
  },

  formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  },

  // ====================
  // TASK OPERATIONS
  // ====================
  enableEditMode(li, task) {
    li.classList.add("editing");
    li.innerHTML = `
      <div class="flex items-center gap-2 w-full">
        <input 
          class="edit-input p-1 border border-gray-300 rounded flex-1" 
          value="${task.name}" 
          data-field="name"
        >
        <select 
          class="edit-input p-1 border border-gray-300 rounded" 
          data-field="priority"
        >
          <option value="low" ${task.priority === "low" ? "selected" : ""}>Low</option>
          <option value="medium" ${task.priority === "medium" ? "selected" : ""}>Medium</option>
          <option value="high" ${task.priority === "high" ? "selected" : ""}>High</option>
        </select>
        <input 
          type="date" 
          class="edit-input p-1 border border-gray-300 rounded" 
          value="${task.dueDate}" 
          data-field="dueDate"
        >
        <button 
          class="save-edit bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
        >
          Save
        </button>
      </div>
    `;

    li.querySelector(".save-edit").addEventListener("click", () => this.saveEdit(li, task));
    li.querySelectorAll(".edit-input").forEach(input => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.saveEdit(li, task);
      });
    });
  },

  saveEdit(li, task) {
    li.querySelectorAll(".edit-input").forEach(input => {
      task[input.getAttribute("data-field")] = input.value;
    });
    this.saveTasks();
    this.renderTasks();
    this.showToast("Task updated");
  },

  // ====================
  // DRAG AND DROP
  // ====================
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

  // ====================
  // EVENT HANDLERS
  // ====================
  handleTaskSubmit(e) {
    e.preventDefault();
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
    this.showToast("Task added");
  },

  handleDeleteClick(e) {
    const taskId = parseInt(e.target.getAttribute("data-id"));
    const taskName = this.tasks.find(t => t.id === taskId)?.name || "Task";
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    this.saveTasks();
    this.renderTasks();
    this.showToast(`Deleted: ${taskName}`, "bg-red-500");
  },

  handleSortPriority() {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    this.tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    this.saveTasks();
    this.renderTasks();
    this.showToast("Sorted by priority");
  },

  handleSortDate() {
    this.tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    this.saveTasks();
    this.renderTasks();
    this.showToast("Sorted by date");
  },

  handleSortName() {
    this.tasks.sort((a, b) => a.name.localeCompare(b.name));
    this.saveTasks();
    this.renderTasks();
    this.showToast("Sorted by name");
  },

  // ====================
  // EVENT LISTENERS
  // ====================
  setupEventListeners() {
    // Form submission
    document.getElementById("task-form").addEventListener("submit", (e) => this.handleTaskSubmit(e));
    
    // Delete buttons
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        this.handleDeleteClick(e);
      }
    });

    // Sorting
    document.getElementById("sort-priority").addEventListener("click", () => this.handleSortPriority());
    document.getElementById("sort-date").addEventListener("click", () => this.handleSortDate());
    document.getElementById("sort-name").addEventListener("click", () => this.handleSortName());

    // Undo/Redo
    document.getElementById("undo-btn").addEventListener("click", () => this.undo());
    document.getElementById("redo-btn").addEventListener("click", () => this.redo());

    // Keyboard shortcuts
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

// Initialize the app
taskManager.init();