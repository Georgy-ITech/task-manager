const input = document.getElementById("taskInput");
const searchInput = document.getElementById("searchInput");
const addButton = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const taskCounter = document.getElementById("taskCounter");
const filterAll = document.getElementById("filterAll");
const filterActive = document.getElementById("filterActive");
const filterDone = document.getElementById("filterDone");
const clearDone = document.getElementById("clearDone");
const sortNewest = document.getElementById("sortNewest");
const sortOldest = document.getElementById("sortOldest");
const sortPriority = document.getElementById("sortPriority");
const sortDeadline = document.getElementById("sortDeadline");
const prioritySelect = document.getElementById("prioritySelect");
const deadlineInput = document.getElementById("deadlineInput");
const FILTER_BUTTONS = [filterAll, filterActive, filterDone];
const SORT_BUTTONS = [sortNewest, sortOldest, sortPriority, sortDeadline];
const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };
const SEARCH_DEBOUNCE_MS = 150;

let tasks = [];
let currentFilter = "all";
let currentSort = "newest";
let searchQuery = "";
let editingTaskId = null;
let enteringTaskId = null;
let toggledTaskId = null;
let searchDebounceTimer = null;
let datePickerState = {
  visible: false,
  viewDate: new Date(),
};
const MONTH_NAMES_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidDeadline(deadline) {
  if (deadline === "") {
    return true;
  }
  const deadlineParts = deadline.split("-");
  const date = new Date(deadline);
  if (
    deadlineParts.length !== 3 ||
    deadlineParts[0].length !== 4 ||
    deadlineParts[1].length !== 2 ||
    deadlineParts[2].length !== 2 ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().split("T")[0] !== deadline
  ) {
    return false;
  }
  return true;
}

function parseDateString(dateString) {
  if (!isValidDeadline(dateString)) {
    return null;
  }
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ensureValidDate(dateValue) {
  if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
    return dateValue;
  }
  return new Date();
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getEmptyStateMarkup(title, subtitle) {
  return `
    <div class="tasks-empty">
      <svg class="tasks-empty__icon" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="emptyG" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#2149ff"></stop>
            <stop offset="1" stop-color="#19b4ff"></stop>
          </linearGradient>
        </defs>
        <rect x="10" y="8" width="44" height="50" rx="10" fill="url(#emptyG)" opacity="0.18"></rect>
        <rect x="16" y="18" width="32" height="4" rx="2" fill="#3554aa"></rect>
        <rect x="16" y="28" width="24" height="4" rx="2" fill="#5e76bf"></rect>
        <rect x="16" y="38" width="18" height="4" rx="2" fill="#7f92ca"></rect>
      </svg>
      <p class="tasks-empty__title">${title}</p>
      <p class="tasks-empty__subtitle">${subtitle}</p>
    </div>
  `;
}




function safeParseJson(json, fallbackValue) {
  try {
    return JSON.parse(json);
  } catch (error) {
    return fallbackValue;
  }
}

function setActiveButton(buttonList, activeButton) {
  buttonList.forEach(function (button) {
    button.classList.remove("is-active");
  });
  activeButton.classList.add("is-active");
}

function initCustomDatePicker() {
  const picker = document.createElement("div");
  picker.className = "date-picker";
  picker.hidden = true;
  document.body.append(picker);

  function renderPicker() {
    datePickerState.viewDate = ensureValidDate(datePickerState.viewDate);
    const viewYear = datePickerState.viewDate.getFullYear();
    const viewMonth = datePickerState.viewDate.getMonth();
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayString = getTodayString();
    const selectedValue = deadlineInput.value;
    const monthLabel = `${MONTH_NAMES_RU[viewMonth]} ${viewYear}`;

    const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const dayButtons = [];

    for (let i = 0; i < startWeekday; i += 1) {
      dayButtons.push('<span></span>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(viewYear, viewMonth, day);
      const value = formatDate(date);
      const isPast = value < todayString;
      const isToday = value === todayString;
      const isSelected = value === selectedValue;

      dayButtons.push(
        `<button type="button" class="date-picker__day${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}${isPast ? " is-disabled" : ""}" data-value="${value}" ${isPast ? "disabled" : ""}>${day}</button>`
      );
    }

    picker.innerHTML = `
      <div class="date-picker__header">
        <button type="button" class="date-picker__nav" data-nav="prev" aria-label="Предыдущий месяц">‹</button>
        <span class="date-picker__month">${monthLabel}</span>
        <button type="button" class="date-picker__nav" data-nav="next" aria-label="Следующий месяц">›</button>
      </div>
      <div class="date-picker__weekdays">${weekdays.map(function (d) { return `<span>${d}</span>`; }).join("")}</div>
      <div class="date-picker__grid">${dayButtons.join("")}</div>
    `;
  }

  function positionPicker() {
    const rect = deadlineInput.getBoundingClientRect();
    picker.style.top = `${rect.bottom + 8}px`;
    picker.style.left = `${rect.left}px`;
  }

  function openPicker() {
    const parsed = parseDateString(deadlineInput.value);
    datePickerState.viewDate = ensureValidDate(parsed || new Date());
    renderPicker();
    positionPicker();
    picker.hidden = false;
    datePickerState.visible = true;
  }

  function closePicker() {
    picker.hidden = true;
    datePickerState.visible = false;
  }

  deadlineInput.addEventListener("focus", openPicker);
  deadlineInput.addEventListener("click", openPicker);
  deadlineInput.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closePicker();
    }
  });

  document.addEventListener("pointerdown", function (event) {
    if (!datePickerState.visible) {
      return;
    }
    if (event.target === deadlineInput || picker.contains(event.target)) {
      return;
    }
    closePicker();
  });

  window.addEventListener("resize", function () {
    if (datePickerState.visible) {
      positionPicker();
    }
  });
  window.addEventListener("scroll", function () {
    if (datePickerState.visible) {
      positionPicker();
    }
  }, true);

  picker.addEventListener("click", function (event) {
    event.stopPropagation();

    const navButton = event.target.closest("[data-nav]");
    if (navButton) {
      const direction = navButton.dataset.nav === "next" ? 1 : -1;
      datePickerState.viewDate = new Date(
        datePickerState.viewDate.getFullYear(),
        datePickerState.viewDate.getMonth() + direction,
        1
      );
      renderPicker();
      return;
    }

    const dayButton = event.target.closest(".date-picker__day");
    if (!dayButton || dayButton.disabled) {
      return;
    }
    deadlineInput.value = dayButton.dataset.value;
    closePicker();
  });
}

function initCustomPrioritySelect() {
  const nativeSelect = prioritySelect;
  if (!nativeSelect) {
    return;
  }

  const shell = document.createElement("div");
  const trigger = document.createElement("button");
  const menu = document.createElement("ul");
  let selectedIndex = nativeSelect.selectedIndex >= 0 ? nativeSelect.selectedIndex : 0;

  shell.className = "select-shell";
  trigger.className = "select-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  menu.className = "select-menu";
  menu.setAttribute("role", "listbox");

  function setSelected(index) {
    const options = Array.from(menu.querySelectorAll(".select-option"));
    options.forEach(function (option, optionIndex) {
      option.classList.toggle("is-selected", optionIndex === index);
      option.setAttribute("aria-selected", optionIndex === index ? "true" : "false");
    });
    selectedIndex = index;
    nativeSelect.selectedIndex = index;
    trigger.textContent = nativeSelect.options[index].textContent;
  }

  function closeMenu() {
    shell.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    shell.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  }

  Array.from(nativeSelect.options).forEach(function (opt, index) {
    const item = document.createElement("li");
    item.className = "select-option";
    item.setAttribute("role", "option");
    item.textContent = opt.textContent;
    item.addEventListener("click", function () {
      setSelected(index);
      closeMenu();
    });
    menu.append(item);
  });

  trigger.addEventListener("click", function () {
    if (shell.classList.contains("is-open")) {
      closeMenu();
      return;
    }
    openMenu();
  });

  trigger.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (selectedIndex + delta + nativeSelect.options.length) % nativeSelect.options.length;
      setSelected(nextIndex);
    }
  });

  document.addEventListener("click", function (event) {
    if (!shell.contains(event.target)) {
      closeMenu();
    }
  });

  nativeSelect.insertAdjacentElement("afterend", shell);
  shell.append(trigger, menu);
  setSelected(selectedIndex);
}

document.querySelectorAll("button").forEach(function (button) {
  button.classList.add("btn");
});

taskList.classList.add("tasks-list");
addButton.classList.add("btn-add");
filterAll.classList.add("btn-secondary");
filterActive.classList.add("btn-secondary");
filterDone.classList.add("btn-secondary");
sortNewest.classList.add("btn-secondary");
sortOldest.classList.add("btn-secondary");
sortPriority.classList.add("btn-secondary");
sortDeadline.classList.add("btn-secondary");
clearDone.classList.add("btn-danger");

[
  addButton,
  filterAll,
  filterActive,
  filterDone,
  clearDone,
  sortNewest,
  sortOldest,
  sortPriority,
  sortDeadline,
].forEach(function (button) {
  button.classList.add("btn--icon");
});

initCustomPrioritySelect();
initCustomDatePicker();

function loadTasks() {
  const savedTasks = localStorage.getItem("tasks");

  if (savedTasks !== null) {
    const parsedTasks = safeParseJson(savedTasks, []);
    if (!Array.isArray(parsedTasks)) {
      tasks = [];
      renderTasks();
      return;
    }

    tasks = parsedTasks.map(function (task) {
      return {
        id: task.id || Date.now(),
        text: task.text,
        done: task.done,
        createdAt: task.createdAt || "Дата неизвестна",
        createdAtTimestamp: task.createdAtTimestamp || task.id,
        priority: task.priority || "medium",
        deadline: task.deadline || "",
      };
    });
  }

  renderTasks();
}

function addTask() {
  const text = input.value.trim();
  const priority = prioritySelect.value;
  const deadline = deadlineInput.value;

  if (text === "") {
    return;
  }

  if (!isValidDeadline(deadline)) {
    alert("Введите реальную дату в формате YYYY-MM-DD!");
    return;
  }

  const today = getTodayString();
  if (deadline !== "" && deadline < today) {
    alert("Нельзя выбрать дату в прошлом");
    return;
  }

  const newTask = {
    id: Date.now(),
    text: text,
    done: false,
    createdAt: new Date().toLocaleString(),
    createdAtTimestamp: Date.now(),
    priority: priority,
    deadline: deadline,
  };

  tasks.push(newTask);
  enteringTaskId = newTask.id;

  saveTasks();

  renderTasks();
  input.value = "";
  deadlineInput.value = "";
}

function renderTasks() {
  taskList.innerHTML = "";

  const doneTasks = tasks.filter(function (task) {
    return task.done
  });

  const activeTasks = tasks.filter(function (task) {
    return !task.done
  });

  clearDone.disabled = doneTasks.length === 0;

  taskCounter.textContent = `Всего задач: ${tasks.length}, выполненных задач: ${doneTasks.length}`;
  let filteredTasks = [...tasks];
  let emptyMessageText = "Задач пока нет";

  filterAll.textContent = `Все (${tasks.length})`;
  filterActive.textContent = `Активные (${activeTasks.length})`;
  filterDone.textContent = `Выполненные (${doneTasks.length})`;


  if (currentFilter === "active") {
    filteredTasks = filteredTasks.filter(function (task) {
      return !task.done;
    });
    setActiveButton(FILTER_BUTTONS, filterActive);
    emptyMessageText = "Нет активных задач";
  }

  if (currentFilter === "done") {
    filteredTasks = filteredTasks.filter(function (task) {
      return task.done;
    });
    setActiveButton(FILTER_BUTTONS, filterDone);
    emptyMessageText = "Нет выполненных задач";
  }

  if (currentFilter === "all") {
    setActiveButton(FILTER_BUTTONS, filterAll);
  }

  if (searchQuery !== "") {
    filteredTasks = filteredTasks.filter(function (task) {
      return task.text.toLowerCase().includes(searchQuery);
    });
    emptyMessageText = "По запросу ничего не найдено";
  }

  if (currentSort === "newest") {
    filteredTasks = filteredTasks.sort(function (a, b) {
      return b.createdAtTimestamp - a.createdAtTimestamp;
    });
    setActiveButton(SORT_BUTTONS, sortNewest);
  }

  if (currentSort === "oldest") {
    filteredTasks = filteredTasks.sort(function (a, b) {
      return a.createdAtTimestamp - b.createdAtTimestamp;
    });
    setActiveButton(SORT_BUTTONS, sortOldest);
  }

  if (currentSort === "priority") {
    filteredTasks = filteredTasks.sort(function (a, b) {
      if (PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority] !== 0) {
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      }
      return b.createdAtTimestamp - a.createdAtTimestamp;
    });
    setActiveButton(SORT_BUTTONS, sortPriority);
  }

  if (currentSort === "deadline") {
    filteredTasks = filteredTasks.sort(function (a, b) {
      if (!a.deadline && b.deadline) {
        return 1;
      }
      if (a.deadline && !b.deadline) {
        return -1;
      }
      if (a.deadline < b.deadline) {
        return -1;
      }
      if (a.deadline > b.deadline) {
        return 1;
      }
      return b.createdAtTimestamp - a.createdAtTimestamp;
    });
    setActiveButton(SORT_BUTTONS, sortDeadline);
  }

  if (filteredTasks.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "tasks-list__item tasks-list__item--empty";
    emptyMessage.innerHTML = getEmptyStateMarkup(
      emptyMessageText,
      "Добавьте новую задачу или измените фильтры, чтобы увидеть результаты."
    );
    taskList.append(emptyMessage);
    return;
  }

  filteredTasks.forEach(function (task) {
    const li = document.createElement("li");
    const taskText = document.createElement("span");
    const taskDate = document.createElement("span");
    const taskInfoWrapper = document.createElement("div");
    const btnWrapper = document.createElement("div");
    const btnDelete = document.createElement("button");
    const btnDone = document.createElement("button");
    const btnEdit = document.createElement("button");
    const taskPriority = document.createElement("span");
    const btnPriority = document.createElement("button");
    const taskDeadline = document.createElement("span");
    const today = getTodayString();
    const isOverdue = task.deadline && !task.done && task.deadline < today;
    const isEditing = editingTaskId === task.id;

    let highlightedText = task.text;
    if (searchQuery !== "") {
      highlightedText = task.text.replace(
        new RegExp(escapeRegExp(searchQuery), "gi"),
        function (match) {
          return `<mark>${match}</mark>`;
        }
      );
    }

    li.className = "tasks-list__item";
    if (task.id === enteringTaskId) {
      li.classList.add("is-entering");
    }
    if (task.id === toggledTaskId) {
      li.classList.add("is-toggled");
    }
    if (isOverdue) {
      li.classList.add("tasks-list__item--overdue");
    }
    taskInfoWrapper.className = "tasks__info";
    btnWrapper.className = "tasks-list__buttons";

    taskPriority.className = "tasks__priority";
    taskPriority.textContent = task.priority;


    if (task.priority === "low") {
      taskPriority.classList.add("tasks__priority--low");
    };
    if (task.priority === "medium") {
      taskPriority.classList.add("tasks__priority--medium");
    };
    if (task.priority === "high") {
      taskPriority.classList.add("tasks__priority--high");
    }

    taskText.className = "tasks__text";
    if (isEditing) {
      const editWrapper = document.createElement("div");
      const editTextInput = document.createElement("input");
      const editPrioritySelect = document.createElement("select");
      const editDeadlineInput = document.createElement("input");
      const btnSaveEdit = document.createElement("button");
      const btnCancelEdit = document.createElement("button");

      editPrioritySelect.classList.add("tasks__edit-select");
      ["low", "medium", "high"].forEach(function (priorityValue) {
        const option = document.createElement("option");

        option.value = priorityValue;
        option.textContent = priorityValue;

        if (priorityValue === task.priority) {
          option.selected = true;
        }
        editPrioritySelect.append(option);
      })

      editWrapper.classList.add("tasks__edit-wrapper");

      editTextInput.value = task.text;
      editTextInput.classList.add("tasks__edit-input");

      editDeadlineInput.type = "date";
      editDeadlineInput.value = task.deadline;
      editDeadlineInput.classList.add("tasks__edit-input");


      btnSaveEdit.textContent = "Сохранить";
      btnSaveEdit.classList.add("btn", "btn-item", "btn-success", "btn--icon", "btn-save");
      btnSaveEdit.addEventListener("click", function () {
        const trimmedText = editTextInput.value.trim();

        if (trimmedText === "") {
          alert("Название задачи не может быть пустым");
          return;
        }

        const newDeadline = editDeadlineInput.value;

        if (!isValidDeadline(newDeadline)) {
          alert("Введите реальную дату в формате YYYY-MM-DD!");
          return;
        }

        const today = getTodayString();

        if (newDeadline !== "" && newDeadline < today) {
          alert("Нельзя выбрать дату в прошлом");
          return;
        }


        tasks = tasks.map(function (item) {
          if (item.id === task.id) {
            return {
              ...item,
              text: trimmedText,
              priority: editPrioritySelect.value,
              deadline: newDeadline,
            };
          }
          return item;
        });

        editingTaskId = null;
        saveTasks();
        renderTasks();
      });

      editTextInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          btnSaveEdit.click();
        }
      });

      btnCancelEdit.textContent = "Отмена";
      btnCancelEdit.classList.add("btn", "btn-item", "btn-secondary", "btn--icon", "btn-cancel");
      btnCancelEdit.addEventListener("click", function () {
        editingTaskId = null;
        renderTasks();
      });

      editWrapper.append(editTextInput, editPrioritySelect, editDeadlineInput, btnSaveEdit, btnCancelEdit);
      taskInfoWrapper.append(editWrapper);
    } else {
      taskText.innerHTML = highlightedText;
      taskInfoWrapper.append(taskText);
    }

    taskDate.className = "tasks__date";
    taskDate.textContent = `Создано: ${task.createdAt}`;

    if (task.deadline) {
      taskDeadline.className = "tasks__deadline";
      taskDeadline.textContent = `Дедлайн: ${task.deadline}`;
      if (isOverdue === true) {
        taskDeadline.textContent = `Просрочено: ${task.deadline}`;
      }
    }

    btnDelete.textContent = "Удалить";
    btnDelete.classList.add("btn", "btn-item", "btn-danger", "btn--icon", "btn-delete");
    btnDelete.setAttribute("aria-label", `Удалить задачу: ${task.text}`);
    btnDelete.addEventListener("click", function () {
      const isConfirmed = confirm("Удалить задачу?");
      if (!isConfirmed) {
        return;
      }
      li.classList.add("is-leaving");
      li.addEventListener("animationend", function () {
        tasks = tasks.filter(function (item) {
          return item.id !== task.id;
        });
        saveTasks();
        renderTasks();
      }, { once: true });
    });

    btnPriority.addEventListener("click", function () {
      tasks = tasks.map(function (item) {
        if (item.id === task.id) {
          let nextPriority;
          if (item.priority === "low") {
            nextPriority = "medium";
          } else if (item.priority === "medium") {
            nextPriority = "high";
          } else {
            nextPriority = "low";
          }
          return {
            ...item,
            priority: nextPriority,
          };
        }
        return item;
      });
      saveTasks();
      renderTasks();
    });
    btnPriority.textContent = "Сменить приоритет";
    btnPriority.classList.add("btn", "btn-item", "btn-secondary", "btn--icon", "btn-priority");

    btnDone.textContent = "Готово";
    btnDone.classList.add("btn", "btn-item", "btn-success", "btn--icon", "btn-done");
    btnDone.setAttribute("aria-label", `${task.done ? "Отметить как невыполненную" : "Отметить как выполненную"}: ${task.text}`);
    btnDone.addEventListener("click", function () {
      toggledTaskId = task.id;
      tasks = tasks.map(function (item) {
        if (item.id === task.id) {
          return {
            ...item,
            done: !item.done
          };
        }
        return item;
      });
      saveTasks();
      renderTasks();
    });
    if (task.done) {
      li.classList.add("done");
    }

    btnEdit.textContent = "Редактировать";
    btnEdit.classList.add("btn", "btn-item", "btn-secondary", "btn--icon", "btn-edit");
    btnEdit.addEventListener("click", function () {
      editingTaskId = task.id;
      renderTasks();
    });


    if (!isEditing) {
      btnWrapper.append(btnDone, btnDelete, btnPriority, btnEdit);
      taskInfoWrapper.append(taskPriority, taskDate, taskDeadline);
    }
    if (isEditing) {
      li.append(taskInfoWrapper);
    } else {
      li.append(taskInfoWrapper, btnWrapper);
    }
    taskList.append(li);
  });

  enteringTaskId = null;
  toggledTaskId = null;
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function saveUiState() {
  const uiState = {
    currentFilter: currentFilter,
    currentSort: currentSort,
    searchQuery: searchQuery,
  };

  localStorage.setItem("uiState", JSON.stringify(uiState));
}

function loadUiState() {
  const savedUiState = localStorage.getItem("uiState");
  if (savedUiState === null) {
    return;
  }
  const parsedUiState = safeParseJson(savedUiState, {});

  currentFilter = parsedUiState.currentFilter || "all";
  currentSort = parsedUiState.currentSort || "newest";
  searchQuery = parsedUiState.searchQuery || "";

  searchInput.value = searchQuery;
}


addButton.addEventListener("click", function () {
  addTask();
});

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addTask();
  }
});


filterAll.addEventListener("click", function () {
  currentFilter = "all";
  saveUiState();
  renderTasks();
});

filterActive.addEventListener("click", function () {
  currentFilter = "active";
  saveUiState();
  renderTasks();
});

filterDone.addEventListener("click", function () {
  currentFilter = "done";
  saveUiState();
  renderTasks();
});

clearDone.addEventListener("click", function () {
  const isConfirmed = confirm("Удалить все выполненные задачи?");
  if (!isConfirmed) {
    return;
  }
  tasks = tasks.filter(function (task) {
    return !task.done;
  });
  saveTasks();
  renderTasks();
});

sortNewest.addEventListener("click", function () {
  currentSort = "newest";
  saveUiState();
  renderTasks();
});

sortOldest.addEventListener("click", function () {
  currentSort = "oldest";
  saveUiState();
  renderTasks();
});

sortPriority.addEventListener("click", function () {
  currentSort = "priority";
  saveUiState();
  renderTasks();
});

sortDeadline.addEventListener("click", function () {
  currentSort = "deadline";
  saveUiState();
  renderTasks();
});

searchInput.addEventListener("input", function () {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(function () {
    searchQuery = searchInput.value.toLowerCase().trim();
    saveUiState();
    renderTasks();
  }, SEARCH_DEBOUNCE_MS);
});

loadTasks();
loadUiState();
renderTasks();
