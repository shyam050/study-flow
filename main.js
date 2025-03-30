      const minutesEl = document.getElementById("minutes");
      const secondsEl = document.getElementById("seconds");
      const timerLabelEl = document.getElementById("timer-label");
      const startBtn = document.getElementById("start-btn");
      const pauseBtn = document.getElementById("pause-btn");
      const resetBtn = document.getElementById("reset-btn");
      const pomodoroBtn = document.getElementById("pomodoro-btn");
      const shortBreakBtn = document.getElementById("short-break-btn");
      const longBreakBtn = document.getElementById("long-break-btn");
      const addTaskBtn = document.getElementById("add-task-btn");
      const taskModal = document.getElementById("task-modal");
      const closeModal = document.querySelector(".close-modal");
      const cancelTaskBtn = document.getElementById("cancel-task-btn");
      const taskForm = document.getElementById("task-form");
      const tasksContainer = document.getElementById("tasks-container");
      const filterBtns = document.querySelectorAll(".filter-btn");

      let timer;
      let minutes = 25;
      let seconds = 0;
      let isRunning = false;
      let currentMode = "pomodoro";
      const modes = {
        pomodoro: { minutes: 25, label: "Focus Time" },
        shortBreak: { minutes: 5, label: "Short Break" },
        longBreak: { minutes: 15, label: "Long Break" },
      };

      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      let currentFilter = "all";
      let currentTaskId = null;

      function init() {
        updateTimerDisplay();
        renderTasks();
        setupEventListeners();
      }

      function updateTimerDisplay() {
        minutesEl.textContent = minutes.toString().padStart(2, "0");
        secondsEl.textContent = seconds.toString().padStart(2, "0");
      }

      function startTimer() {
        if (isRunning) return;

        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;

        timer = setInterval(() => {
          if (seconds === 0) {
            if (minutes === 0) {
              clearInterval(timer);
              playAlarm();
              isRunning = false;
              startBtn.disabled = false;
              pauseBtn.disabled = true;
              return;
            }
            minutes--;
            seconds = 59;
          } else {
            seconds--;
          }
          updateTimerDisplay();
        }, 1000);
      }

      function pauseTimer() {
        clearInterval(timer);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
      }

      function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;

        minutes = modes[currentMode].minutes;
        seconds = 0;
        updateTimerDisplay();
      }

      function changeMode(mode) {
        pomodoroBtn.classList.remove("active");
        shortBreakBtn.classList.remove("active");
        longBreakBtn.classList.remove("active");

        currentMode = mode;

        if (mode === "pomodoro") {
          pomodoroBtn.classList.add("active");
        } else if (mode === "shortBreak") {
          shortBreakBtn.classList.add("active");
        } else if (mode === "longBreak") {
          longBreakBtn.classList.add("active");
        }

        clearInterval(timer);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;

        minutes = modes[mode].minutes;
        seconds = 0;
        timerLabelEl.textContent = modes[mode].label;
        updateTimerDisplay();
      }

      function playAlarm() {
        const audio = new Audio(
          "https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3"
        );
        audio.play();

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Timer Complete", {
            body: `Your ${modes[currentMode].label} session is complete!`,
            icon: "https://cdn-icons-png.flaticon.com/512/3589/3589030.png",
          });
        }
      }

      function renderTasks() {
        let filteredTasks = tasks;

        if (currentFilter === "today") {
          const today = new Date().toISOString().split("T")[0];
          filteredTasks = tasks.filter((task) => task.date === today);
        } else if (currentFilter === "upcoming") {
          const today = new Date().toISOString().split("T")[0];
          filteredTasks = tasks.filter((task) => task.date > today);
        } else if (currentFilter === "completed") {
          filteredTasks = tasks.filter((task) => task.completed);
        }

        filteredTasks.sort((a, b) => {
          if (a.important && !b.important) return -1;
          if (!a.important && b.important) return 1;
          return new Date(a.date) - new Date(b.date);
        });

        tasksContainer.innerHTML = "";

        if (filteredTasks.length === 0) {
          tasksContainer.innerHTML = `
            <div class="empty-state">
                <p>No tasks found</p>
                <button id="empty-add-task" class="btn primary">Add your first task</button>
            </div>
        `;

          document
            .getElementById("empty-add-task")
            .addEventListener("click", openAddTaskModal);
          return;
        }

        filteredTasks.forEach((task) => {
          const taskElement = document.createElement("div");
          taskElement.className = `task-item ${
            task.important ? "important" : ""
          } ${task.completed ? "completed" : ""}`;
          taskElement.dataset.id = task.id;

          const taskDate = new Date(task.date);
          const formattedDate = taskDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year:
              taskDate.getFullYear() !== new Date().getFullYear()
                ? "numeric"
                : undefined,
          });

          taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title-container">
                    <input type="checkbox" class="task-complete-checkbox" ${
                      task.completed ? "checked" : ""
                    }>
                    <span class="task-title">${task.title}</span>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit-task">✏️</button>
                    <button class="task-action-btn delete-task">🗑️</button>
                </div>
            </div>
            ${
              task.description
                ? `<p class="task-description">${task.description}</p>`
                : ""
            }
            <div class="task-meta">
                <span class="task-date">${formattedDate}</span>
                <span class="task-category ${task.category}">${
            task.category
          }</span>
            </div>
        `;

          tasksContainer.appendChild(taskElement);

          const checkbox = taskElement.querySelector(".task-complete-checkbox");
          checkbox.addEventListener("change", () =>
            toggleTaskComplete(task.id)
          );

          const editBtn = taskElement.querySelector(".edit-task");
          editBtn.addEventListener("click", () => openEditTaskModal(task.id));

          const deleteBtn = taskElement.querySelector(".delete-task");
          deleteBtn.addEventListener("click", () => deleteTask(task.id));
        });
      }

      function openAddTaskModal() {
        taskForm.reset();
        document.getElementById("modal-title").textContent = "Add New Task";
        document.getElementById("task-id").value = "";
        currentTaskId = null;

        const today = new Date().toISOString().split("T")[0];
        document.getElementById("task-date").value = today;

        taskModal.style.display = "flex";
      }

      function openEditTaskModal(taskId) {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        document.getElementById("modal-title").textContent = "Edit Task";
        document.getElementById("task-title").value = task.title;
        document.getElementById("task-description").value =
          task.description || "";
        document.getElementById("task-date").value = task.date;
        document.getElementById("task-category").value = task.category;
        document.getElementById("task-important").checked = task.important;
        document.getElementById("task-id").value = task.id;
        currentTaskId = task.id;

        taskModal.style.display = "flex";
      }

      function closeTaskModal() {
        taskModal.style.display = "none";
      }

      function saveTask(e) {
        e.preventDefault();

        const title = document.getElementById("task-title").value;
        const description = document.getElementById("task-description").value;
        const date = document.getElementById("task-date").value;
        const category = document.getElementById("task-category").value;
        const important = document.getElementById("task-important").checked;

        if (currentTaskId) {
          const taskIndex = tasks.findIndex((t) => t.id === currentTaskId);
          if (taskIndex !== -1) {
            tasks[taskIndex] = {
              ...tasks[taskIndex],
              title,
              description,
              date,
              category,
              important,
            };
          }
        } else {
          const newTask = {
            id: Date.now().toString(),
            title,
            description,
            date,
            category,
            important,
            completed: false,
            createdAt: new Date().toISOString(),
          };

          tasks.push(newTask);
        }

        localStorage.setItem("tasks", JSON.stringify(tasks));

        closeTaskModal();
        renderTasks();
      }

      function toggleTaskComplete(taskId) {
        const taskIndex = tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          tasks[taskIndex].completed = !tasks[taskIndex].completed;

          localStorage.setItem("tasks", JSON.stringify(tasks));

          renderTasks();
        }
      }

      function deleteTask(taskId) {
        if (confirm("Are you sure you want to delete this task?")) {
          tasks = tasks.filter((t) => t.id !== taskId);

          localStorage.setItem("tasks", JSON.stringify(tasks));

          renderTasks();
        }
      }

      function changeFilter(filter) {
        filterBtns.forEach((btn) => btn.classList.remove("active"));

        event.target.classList.add("active");

        currentFilter = filter;
        renderTasks();
      }

      function setupEventListeners() {
        startBtn.addEventListener("click", startTimer);
        pauseBtn.addEventListener("click", pauseTimer);
        resetBtn.addEventListener("click", resetTimer);

        pomodoroBtn.addEventListener("click", () => changeMode("pomodoro"));
        shortBreakBtn.addEventListener("click", () => changeMode("shortBreak"));
        longBreakBtn.addEventListener("click", () => changeMode("longBreak"));

        addTaskBtn.addEventListener("click", openAddTaskModal);
        closeModal.addEventListener("click", closeTaskModal);
        cancelTaskBtn.addEventListener("click", closeTaskModal);
        taskForm.addEventListener("submit", saveTask);

        filterBtns.forEach((btn) => {
          btn.addEventListener("click", () => changeFilter(btn.dataset.filter));
        });

        if (
          "Notification" in window &&
          Notification.permission !== "granted" &&
          Notification.permission !== "denied"
        ) {
          Notification.requestPermission();
        }

        window.addEventListener("click", (e) => {
          if (e.target === taskModal) {
            closeTaskModal();
          }
        });
      }

      document.addEventListener("DOMContentLoaded", init);
