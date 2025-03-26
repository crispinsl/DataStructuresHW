// Data Structure: Array of tasks (loaded from localStorage)
let tasks = JSON.parse(localStorage.getItem("tasks")) || [
    { id: 1, name: "Finish project", priority: "high", dueDate: "2023-12-01" },
    { id: 2, name: "Buy groceries", priority: "medium", dueDate: "2023-11-25" },
    { id: 3, name: "Call mom", priority: "low", dueDate: "2023-11-20" }
  ];

  let history = [];
    const MAX_HISTORY = 20;

    // Save current state to history
    function saveSnapshot() {
        history.push(JSON.stringify(tasks));
        if (history.length > MAX_HISTORY) history.shift(); // Remove oldest
    }

    // Undo last action
    function undo() {
        if (history.length > 1) { // Skip if only 1 snapshot exists
        history.pop(); // Remove current state
        tasks = JSON.parse(history[history.length - 1]); // Restore previous
        saveTasks();
        renderTasks();
        }
    }
  
    saveSnapshot();

  // DOM Elements
  const taskForm = document.getElementById("task-form");
  const taskList = document.getElementById("task-list");
  
  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }
  
  // Render tasks with drag-and-drop and edit support
  function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach(task => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.setAttribute("data-id", task.id);
      li.setAttribute("draggable", "true");
      li.innerHTML = `
        <div>
          <span class="name">${task.name}</span>
          <span class="priority ${task.priority}">${task.priority}</span>
          <span class="due-date">Due: ${task.dueDate}</span>
        </div>
        <button class="delete-btn" data-id="${task.id}">Delete</button>
      `;
      taskList.appendChild(li);
  
      // Double-click to edit
      li.addEventListener("dblclick", () => enableEditMode(li, task));
    });
  
    // Add delete event listeners
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        tasks = tasks.filter(task => task.id !== parseInt(e.target.getAttribute("data-id")));
        saveTasks();
        renderTasks();
      });
    });
  
    // Drag-and-drop setup
    setupDragAndDrop();
    saveSnapshot();
  }
  
  // Edit Task: Enable edit mode
  function enableEditMode(li, task) {
    li.classList.add("editing");
    const nameSpan = li.querySelector(".name");
    const prioritySpan = li.querySelector(".priority");
    const dueDateSpan = li.querySelector(".due-date");
  
    // Replace spans with input fields
    nameSpan.outerHTML = `<input class="edit-input" value="${task.name}" data-field="name">`;
    prioritySpan.outerHTML = `
      <select class="edit-input" data-field="priority">
        <option value="low" ${task.priority === "low" ? "selected" : ""}>Low</option>
        <option value="medium" ${task.priority === "medium" ? "selected" : ""}>Medium</option>
        <option value="high" ${task.priority === "high" ? "selected" : ""}>High</option>
      </select>
    `;
    dueDateSpan.outerHTML = `<input type="date" class="edit-input" value="${task.dueDate}" data-field="dueDate">`;
  
    // Save on Enter/Blur
    const inputs = li.querySelectorAll(".edit-input");
    inputs.forEach(input => {
      input.addEventListener("blur", () => saveEdit(li, task));
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") saveEdit(li, task);
      });
    });
    saveSnapshot();
  }
  
  // Edit Task: Save changes
  function saveEdit(li, task) {
    const inputs = li.querySelectorAll(".edit-input");
    inputs.forEach(input => {
      task[input.getAttribute("data-field")] = input.value;
    });
    saveTasks();
    renderTasks();
  }
  
  // Drag-and-drop functionality
  function setupDragAndDrop() {
    const items = document.querySelectorAll(".task-item");
    let draggedItem = null;
  
    items.forEach(item => {
      item.addEventListener("dragstart", () => {
        draggedItem = item;
        setTimeout(() => item.classList.add("dragging"), 0);
      });
  
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
      });
    });
  
    taskList.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(taskList, e.clientY);
      if (afterElement == null) {
        taskList.appendChild(draggedItem);
      } else {
        taskList.insertBefore(draggedItem, afterElement);
      }
    });
  
    taskList.addEventListener("drop", () => {
      // Update tasks array based on new order
      const newTasks = [];
      document.querySelectorAll(".task-item").forEach(item => {
        const id = parseInt(item.getAttribute("data-id"));
        const task = tasks.find(t => t.id === id);
        newTasks.push(task);
      });
      tasks = newTasks;
      saveTasks();
    });
  }
  
  // Helper for drag-and-drop positioning
  function getDragAfterElement(container, y) {
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
  }
  
  // Add a new task
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newTask = {
      id: Date.now(),
      name: document.getElementById("task-name").value,
      priority: document.getElementById("task-priority").value,
      dueDate: document.getElementById("task-due").value
    };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
  });
  
  // Sorting Algorithms (unchanged)
  document.getElementById("sort-priority").addEventListener("click", () => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    saveTasks();
    renderTasks();
  });
  
  document.getElementById("sort-date").addEventListener("click", () => {
    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    saveTasks();
    renderTasks();
  });
  
  document.getElementById("sort-name").addEventListener("click", () => {
    tasks.sort((a, b) => a.name.localeCompare(b.name));
    saveTasks();
    renderTasks();
  });

  document.getElementById("undo-btn").addEventListener("click", undo);
  
  // Initial render
  renderTasks();