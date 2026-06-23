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

function appendHighlightedText(element, text, query) {
  if (query === "") {
    element.textContent = text;
    return;
  }

  const expression = new RegExp(escapeRegExp(query), "gi");
  let currentIndex = 0;
  let match = expression.exec(text);

  while (match !== null) {
    if (match.index > currentIndex) {
      element.append(document.createTextNode(text.slice(currentIndex, match.index)));
    }

    const mark = document.createElement("mark");
    mark.textContent = match[0];
    element.append(mark);

    currentIndex = match.index + match[0].length;
    match = expression.exec(text);
  }

  if (currentIndex < text.length) {
    element.append(document.createTextNode(text.slice(currentIndex)));
  }
}

function createEmptyState(title, subtitle) {
  const emptyState = document.createElement("div");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  const firstStop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  const secondStop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  const cardShape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const firstLine = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const secondLine = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const thirdLine = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const titleElement = document.createElement("p");
  const subtitleElement = document.createElement("p");

  emptyState.className = "tasks-empty";
  icon.classList.add("tasks-empty__icon");
  icon.setAttribute("viewBox", "0 0 64 64");
  icon.setAttribute("aria-hidden", "true");

  gradient.id = "emptyG";
  gradient.setAttribute("x1", "8");
  gradient.setAttribute("y1", "8");
  gradient.setAttribute("x2", "56");
  gradient.setAttribute("y2", "56");
  gradient.setAttribute("gradientUnits", "userSpaceOnUse");

  firstStop.setAttribute("offset", "0");
  firstStop.setAttribute("stop-color", "#2149ff");
  secondStop.setAttribute("offset", "1");
  secondStop.setAttribute("stop-color", "#19b4ff");

  cardShape.setAttribute("x", "10");
  cardShape.setAttribute("y", "8");
  cardShape.setAttribute("width", "44");
  cardShape.setAttribute("height", "50");
  cardShape.setAttribute("rx", "10");
  cardShape.setAttribute("fill", "url(#emptyG)");
  cardShape.setAttribute("opacity", "0.18");

  [
    { element: firstLine, width: "32", y: "18", fill: "#3554aa" },
    { element: secondLine, width: "24", y: "28", fill: "#5e76bf" },
    { element: thirdLine, width: "18", y: "38", fill: "#7f92ca" },
  ].forEach(function (line) {
    line.element.setAttribute("x", "16");
    line.element.setAttribute("y", line.y);
    line.element.setAttribute("width", line.width);
    line.element.setAttribute("height", "4");
    line.element.setAttribute("rx", "2");
    line.element.setAttribute("fill", line.fill);
  });

  titleElement.className = "tasks-empty__title";
  titleElement.textContent = title;
  subtitleElement.className = "tasks-empty__subtitle";
  subtitleElement.textContent = subtitle;

  gradient.append(firstStop, secondStop);
  defs.append(gradient);
  icon.append(defs, cardShape, firstLine, secondLine, thirdLine);
  emptyState.append(icon, titleElement, subtitleElement);

  return emptyState;
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

function getTaskStats() {
  const doneTasks = tasks.filter(function (task) {
    return task.done;
  });
  const activeTasks = tasks.filter(function (task) {
    return !task.done;
  });

  return {
    activeCount: activeTasks.length,
    doneCount: doneTasks.length,
    totalCount: tasks.length,
  };
}

function updateTaskSummary(stats) {
  clearDone.disabled = stats.doneCount === 0;
  taskCounter.textContent = `Всего задач: ${stats.totalCount}, выполненных задач: ${stats.doneCount}`;
  filterAll.textContent = `Все (${stats.totalCount})`;
  filterActive.textContent = `Активные (${stats.activeCount})`;
  filterDone.textContent = `Выполненные (${stats.doneCount})`;
}

function getFilteredTasks() {
  let filteredTasks = [...tasks];
  let emptyMessageText = "Задач пока нет";

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

  return {
    emptyMessageText: emptyMessageText,
    tasks: filteredTasks,
  };
}

function sortTasks(taskItems) {
  const sortedTasks = [...taskItems];

  if (currentSort === "newest") {
    setActiveButton(SORT_BUTTONS, sortNewest);
    return sortedTasks.sort(function (a, b) {
      return b.createdAtTimestamp - a.createdAtTimestamp;
    });
  }

  if (currentSort === "oldest") {
    setActiveButton(SORT_BUTTONS, sortOldest);
    return sortedTasks.sort(function (a, b) {
      return a.createdAtTimestamp - b.createdAtTimestamp;
    });
  }

  if (currentSort === "priority") {
    setActiveButton(SORT_BUTTONS, sortPriority);
    return sortedTasks.sort(function (a, b) {
      if (PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority] !== 0) {
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      }
      return b.createdAtTimestamp - a.createdAtTimestamp;
    });
  }

  if (currentSort === "deadline") {
    setActiveButton(SORT_BUTTONS, sortDeadline);
    return sortedTasks.sort(function (a, b) {
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
  }

  return sortedTasks;
}

function renderEmptyState(title) {
  const emptyMessage = document.createElement("li");
  emptyMessage.className = "tasks-list__item tasks-list__item--empty";
  emptyMessage.append(createEmptyState(
    title,
    "Добавьте новую задачу или измените фильтры, чтобы увидеть результаты."
  ));
  taskList.append(emptyMessage);
}

function createPriorityBadge(priority) {
  const taskPriority = document.createElement("span");
  taskPriority.className = "tasks__priority";
  taskPriority.textContent = priority;

  if (priority === "low") {
    taskPriority.classList.add("tasks__priority--low");
  }
  if (priority === "medium") {
    taskPriority.classList.add("tasks__priority--medium");
  }
  if (priority === "high") {
    taskPriority.classList.add("tasks__priority--high");
  }

  return taskPriority;
}

function createTaskDate(createdAt) {
  const taskDate = document.createElement("span");
  taskDate.className = "tasks__date";
  taskDate.textContent = `Создано: ${createdAt}`;

  return taskDate;
}

function createTaskDeadline(task, isOverdue) {
  if (!task.deadline) {
    return null;
  }

  const taskDeadline = document.createElement("span");
  taskDeadline.className = "tasks__deadline";
  taskDeadline.textContent = `Дедлайн: ${task.deadline}`;

  if (isOverdue) {
    taskDeadline.textContent = `Просрочено: ${task.deadline}`;
  }

  return taskDeadline;
}

function updateTask(taskId, values) {
  tasks = tasks.map(function (item) {
    if (item.id === taskId) {
      return {
        ...item,
        ...values,
      };
    }
    return item;
  });

  saveTasks();
  renderTasks();
}

function createEditForm(task) {
  const editWrapper = document.createElement("div");
  const editTextInput = document.createElement("input");
  const editPrioritySelect = document.createElement("select");
  const editDeadlineInput = document.createElement("input");
  const btnSaveEdit = document.createElement("button");
  const btnCancelEdit = document.createElement("button");

  editWrapper.classList.add("tasks__edit-wrapper");
  editTextInput.value = task.text;
  editTextInput.classList.add("tasks__edit-input");
  editDeadlineInput.type = "date";
  editDeadlineInput.value = task.deadline;
  editDeadlineInput.classList.add("tasks__edit-input");
  editPrioritySelect.classList.add("tasks__edit-select");

  ["low", "medium", "high"].forEach(function (priorityValue) {
    const option = document.createElement("option");
    option.value = priorityValue;
    option.textContent = priorityValue;

    if (priorityValue === task.priority) {
      option.selected = true;
    }

    editPrioritySelect.append(option);
  });

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

    editingTaskId = null;
    updateTask(task.id, {
      deadline: newDeadline,
      priority: editPrioritySelect.value,
      text: trimmedText,
    });
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

  return editWrapper;
}

function deleteTask(taskId, element) {
  let isRemoved = false;

  function removeTask() {
    if (isRemoved) {
      return;
    }

    isRemoved = true;
    tasks = tasks.filter(function (item) {
      return item.id !== taskId;
    });
    saveTasks();
    renderTasks();
  }

  element.classList.add("is-leaving");
  element.addEventListener("animationend", removeTask, { once: true });
  setTimeout(removeTask, 280);
}

function changeTaskPriority(taskId) {
  tasks = tasks.map(function (item) {
    if (item.id === taskId) {
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
}

function toggleTaskDone(taskId) {
  toggledTaskId = taskId;
  tasks = tasks.map(function (item) {
    if (item.id === taskId) {
      return {
        ...item,
        done: !item.done,
      };
    }
    return item;
  });

  saveTasks();
  renderTasks();
}

function createTaskActions(task, element) {
  const btnWrapper = document.createElement("div");
  const btnDone = document.createElement("button");
  const btnDelete = document.createElement("button");
  const btnPriority = document.createElement("button");
  const btnEdit = document.createElement("button");

  btnWrapper.className = "tasks-list__buttons";

  btnDone.textContent = "Готово";
  btnDone.classList.add("btn", "btn-item", "btn-success", "btn--icon", "btn-done");
  btnDone.setAttribute("aria-label", `${task.done ? "Отметить как невыполненную" : "Отметить как выполненную"}: ${task.text}`);
  btnDone.addEventListener("click", function () {
    toggleTaskDone(task.id);
  });

  btnDelete.textContent = "Удалить";
  btnDelete.classList.add("btn", "btn-item", "btn-danger", "btn--icon", "btn-delete");
  btnDelete.setAttribute("aria-label", `Удалить задачу: ${task.text}`);
  btnDelete.addEventListener("click", function () {
    const isConfirmed = confirm("Удалить задачу?");
    if (!isConfirmed) {
      return;
    }

    deleteTask(task.id, element);
  });

  btnPriority.textContent = "Сменить приоритет";
  btnPriority.classList.add("btn", "btn-item", "btn-secondary", "btn--icon", "btn-priority");
  btnPriority.addEventListener("click", function () {
    changeTaskPriority(task.id);
  });

  btnEdit.textContent = "Редактировать";
  btnEdit.classList.add("btn", "btn-item", "btn-secondary", "btn--icon", "btn-edit");
  btnEdit.addEventListener("click", function () {
    editingTaskId = task.id;
    renderTasks();
  });

  btnWrapper.append(btnDone, btnDelete, btnPriority, btnEdit);

  return btnWrapper;
}

function createTaskElement(task) {
  const li = document.createElement("li");
  const taskText = document.createElement("span");
  const taskInfoWrapper = document.createElement("div");
  const today = getTodayString();
  const isOverdue = task.deadline && !task.done && task.deadline < today;
  const isEditing = editingTaskId === task.id;

  li.className = "tasks-list__item";
  taskInfoWrapper.className = "tasks__info";
  taskText.className = "tasks__text";

  if (task.id === enteringTaskId) {
    li.classList.add("is-entering");
  }
  if (task.id === toggledTaskId) {
    li.classList.add("is-toggled");
  }
  if (isOverdue) {
    li.classList.add("tasks-list__item--overdue");
  }
  if (task.done) {
    li.classList.add("done");
  }

  if (isEditing) {
    taskInfoWrapper.append(createEditForm(task));
    li.append(taskInfoWrapper);
    return li;
  }

  appendHighlightedText(taskText, task.text, searchQuery);
  taskInfoWrapper.append(taskText);
  taskInfoWrapper.append(createPriorityBadge(task.priority), createTaskDate(task.createdAt));

  const taskDeadline = createTaskDeadline(task, isOverdue);
  if (taskDeadline) {
    taskInfoWrapper.append(taskDeadline);
  }

  li.append(taskInfoWrapper, createTaskActions(task, li));

  return li;
}

function renderTasks() {
  taskList.innerHTML = "";

  updateTaskSummary(getTaskStats());

  const filteredResult = getFilteredTasks();
  const sortedTasks = sortTasks(filteredResult.tasks);

  if (sortedTasks.length === 0) {
    renderEmptyState(filteredResult.emptyMessageText);
    return;
  }

  sortedTasks.forEach(function (task) {
    taskList.append(createTaskElement(task));
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





