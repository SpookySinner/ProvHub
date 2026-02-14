// --- Существующий код темы (оставляем как есть) ---
const themeSwitch = document.getElementById('themeSwitch');
const htmlElement = document.documentElement;

function setTheme(theme) {
  htmlElement.setAttribute('data-bs-theme', theme);
  themeSwitch.checked = (theme === 'dark');
  localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  setTheme('dark');
} else if (savedTheme === 'light') {
  setTheme('light');
} else {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');
}

themeSwitch.addEventListener('change', function(e) {
  const newTheme = this.checked ? 'dark' : 'light';
  setTheme(newTheme);
});

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
function handleSystemThemeChange(e) {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
}
mediaQuery.addEventListener('change', handleSystemThemeChange);
// --- Конец кода темы ---


// --- НОВАЯ ЛОГИКА ПРИЛОЖЕНИЯ ---

// Проверяем, загрузилась ли база данных
if (typeof itemsDatabase === 'undefined') {
  console.error('Ошибка: База данных itemsDatabase не найдена! Убедись, что файл items-db.js подключен.');
} else {
  console.log(`База данных загружена. Всего предметов: ${itemsDatabase.length}`);
}

// --- Константы ---
const TOTAL_ITEMS_IN_GAME = 960; // Всего предметов в игре

// --- Глобальные переменные ---
let currentCategory = 'Все предметы';
let currentSearchTerm = '';
// Используем оригинальную базу данных без изменений
let itemsData = itemsDatabase || [];

// --- Элементы DOM ---
const sidebarNav = document.querySelector('.nav-sidebar');
const itemsGrid = document.querySelector('.items-tab-grid');
const searchInput = document.querySelector('.ph-search .form-control');
const placeholderText = document.querySelector('.ph-placeholder');

// --- Функции ---

/**
 * Находит отсутствующие ID в базе данных
 */
function findMissingIds() {
  const existingIds = new Set(itemsData.map(item => item.id));
  const missingIds = [];
  
  for (let i = 1; i <= TOTAL_ITEMS_IN_GAME; i++) {
    if (!existingIds.has(i)) {
      missingIds.push(i);
    }
  }
  
  return missingIds;
}

/**
 * Добавляет информацию о статистике под категории
 */
function addStatsToSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  
  // Удаляем старую статистику, если есть
  const oldStats = document.querySelector('.sidebar-stats');
  if (oldStats) oldStats.remove();
  
  const missingIds = findMissingIds();
  const missingCount = missingIds.length;
  const existingCount = itemsData.length;
  
  const statsDiv = document.createElement('div');
  statsDiv.className = 'sidebar-stats mt-4 pt-3 border-top';
  
  let statsHtml = `
    <div class="small">
      <div class="d-flex justify-content-between mb-1">
        <span class="text-secondary">Всего в игре:</span>
        <span class="fw-semibold">${TOTAL_ITEMS_IN_GAME}</span>
      </div>
      <div class="d-flex justify-content-between mb-2">
        <span class="text-secondary">В базе данных:</span>
        <span class="fw-semibold ${existingCount === TOTAL_ITEMS_IN_GAME ? 'text-success' : 'text-warning'}">${existingCount}</span>
      </div>
  `;
  
  if (missingCount > 0) {
    // Показываем только первые 10 отсутствующих ID, чтобы не засорять сайдбар
    const displayedIds = missingIds.slice(0, 15);
    const remainingCount = missingCount - displayedIds.length;
    
    statsHtml += `
      <div class="mt-2">
        <div class="text-secondary mb-1">Не хватает (${missingCount} шт.):</div>
        <div class="d-flex flex-wrap gap-1 mb-1">
          ${displayedIds.map(id => `<span class="badge bg-danger" style="font-size: 0.7rem;">${id}</span>`).join('')}
        </div>
    `;
    
    if (remainingCount > 0) {
      statsHtml += `<div class="text-secondary small mt-1">и еще ${remainingCount} ID...</div>`;
    }
    
    statsHtml += `</div>`;
  } else {
    statsHtml += `
      <div class="text-success small mt-2">
        <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Все предметы собраны!
      </div>
    `;
  }
  
  statsDiv.innerHTML = statsHtml;
  sidebar.appendChild(statsDiv);
  
  // Обновляем иконки Lucide в статистике
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * Создает и возвращает массив уникальных категорий (type) из базы данных.
 */
function getCategoriesFromItems() {
  if (!itemsData.length) return ['Все предметы'];

  const types = itemsData.map(item => item.type);
  const uniqueTypes = [...new Set(types)];
  uniqueTypes.sort();
  return ['Все предметы', ...uniqueTypes];
}

/**
 * Строит меню категорий в сайдбаре.
 */
function buildCategoriesMenu() {
  if (!sidebarNav || !itemsData.length) return;

  const categories = getCategoriesFromItems();
  sidebarNav.innerHTML = '';

  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'nav-link';
    if (category === currentCategory) {
      button.classList.add('active');
    }

    let itemCount;
    if (category === 'Все предметы') {
      itemCount = itemsData.length;
    } else {
      itemCount = itemsData.filter(item => item.type === category).length;
    }

    button.innerHTML = `
      <span>${category}</span>
      <span class="ms-auto">${itemCount}</span>
    `;

    button.addEventListener('click', () => {
      document.querySelectorAll('.nav-sidebar .nav-link').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentCategory = category;
      filterAndRenderItems();
      
      // Закрываем все popover при смене категории
      closeAllPopovers();
    });

    sidebarNav.appendChild(button);
  });
  
  // Добавляем статистику после категорий
  addStatsToSidebar();
}

/**
 * Получает правильный путь к иконке для предмета
 */
function getItemIconPath(item) {
  // Если есть badgeImage - используем его (для винилов и подобных)
  if (item.badgeImage) {
    // У badgeImage уже есть путь, например "Винилы/hlw_2023_2.png"
    if (item.badgeImage.startsWith('Винилы/')) {
      return `icons/${item.badgeImage}`;
    }
    return `icons/${item.badgeImage}`;
  }
  
  // Для обычных предметов используем ID
  return `icons/${item.id}.png`;
}

/**
 * Закрывает все открытые popover
 */
function closeAllPopovers() {
  // Удаляем все инстансы Popover
  document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
    const pop = bootstrap.Popover.getInstance(el);
    if (pop) {
      pop.dispose();
    }
  });
  
  // Удаляем все DOM-элементы popover'ов
  document.querySelectorAll('.popover').forEach(popover => popover.remove());
}

/**
 * Фильтрует предметы на основе категории и поиска.
 */
function getFilteredItems() {
  if (!itemsData.length) return [];

  let filtered = itemsData;

  if (currentCategory !== 'Все предметы') {
    filtered = filtered.filter(item => item.type === currentCategory);
  }

  if (currentSearchTerm.trim() !== '') {
    const searchLower = currentSearchTerm.toLowerCase();
    filtered = filtered.filter(item => {
      return (item.name && item.name.toLowerCase().includes(searchLower)) ||
             (item.description && item.description.toLowerCase().includes(searchLower)) ||
             (item.event && item.event.toLowerCase().includes(searchLower));
    });
  }

  return filtered;
}

/**
 * Отрисовывает предметы в сетке.
 */
function renderItemsGrid(itemsToRender) {
  if (!itemsGrid) return;

  itemsGrid.innerHTML = '';

  if (itemsToRender.length === 0) {
    itemsGrid.innerHTML = '<div class="text-center text-secondary p-4">Ничего не найдено</div>';
    return;
  }

  itemsToRender.forEach((item) => {
    const itemButton = document.createElement('button');
    itemButton.className = 'items-tab-box';
    itemButton.dataset.itemId = item.id;
    if (item.badgeImage) {
      itemButton.dataset.badgeImage = item.badgeImage;
    }

    // Создаём контейнер для относительного позиционирования
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';

    const iconPath = getItemIconPath(item);

    const img = document.createElement('img');
    img.src = iconPath;
    img.alt = item.name || 'Предмет';
    img.loading = 'lazy';
    img.style.width = '60px';
    img.style.height = '60px';

    img.onerror = () => {
      img.src = 'icons/placeholder.png';
      img.alt = 'Иконка не найдена';
      console.warn(`Иконка не найдена: ${iconPath} для предмета "${item.name}" (ID: ${item.id})`);
    };

    container.appendChild(img);

    // Добавляем иконку щита для защищённых предметов
    if (item.protected === true) {
      const shieldIcon = document.createElement('i');
      shieldIcon.setAttribute('data-lucide', 'shield');
      // shieldIcon.style.position = 'absolute';
      // shieldIcon.style.top = '4px';
      // shieldIcon.style.right = '4px';
      // shieldIcon.style.width = '20px';
      // shieldIcon.style.height = '20px';
      // shieldIcon.style.color = '#ffc107';
      // shieldIcon.style.fill = '#ffc107';
      // shieldIcon.style.strokeWidth = '2';
      // shieldIcon.style.filter = 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))';
      container.appendChild(shieldIcon);
    }

    itemButton.appendChild(container);
    itemButton.addEventListener('click', (event) => showItemPopover(event, item));

    itemsGrid.appendChild(itemButton);
  });

  // Обновляем иконки Lucide
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * Главная функция фильтрации и отрисовки.
 */
function filterAndRenderItems() {
  const filteredItems = getFilteredItems();
  renderItemsGrid(filteredItems);
  
  if (placeholderText) {
    const totalInCategory = (currentCategory === 'Все предметы') 
      ? itemsData.length 
      : itemsData.filter(i => i.type === currentCategory).length;
    placeholderText.placeholder = `Поиск ${filteredItems.length} из ${totalInCategory} предметов...`;
  }
}

/**
 * Показывает Popover с информацией о предмете.
 */
function showItemPopover(event, item) {
  event.stopPropagation(); // Предотвращаем всплытие события
  
  const currentButton = event.currentTarget;
  
  // Проверяем, есть ли уже открытый popover на этом элементе
  const existingPopover = bootstrap.Popover.getInstance(currentButton);
  
  if (existingPopover) {
    // Если popover уже открыт на этом элементе - закрываем его и выходим
    existingPopover.dispose();
    return;
  }
  
  // Закрываем ВСЕ другие popover перед открытием нового
  closeAllPopovers();

  // Собираем HTML для поповера (ПРОСТОЙ СТИЛЬ)
  let contentHtml = `
    <div style="text-align: left; font-size: 0.9rem; min-width: 200px;">
      <strong>${item.name}</strong><br>
      <span class="text-secondary">ID: ${item.id}</span><br>
      <hr class="my-1">
  `;

  // Добавляем характеристики, если они есть
  if (item.health) contentHtml += `<div><span class="fw-semibold">Здоровье:</span> +${item.health}</div>`;
  if (item.food) contentHtml += `<div><span class="fw-semibold">Еда:</span> +${item.food}</div>`;
  if (item.weight) contentHtml += `<div><span class="fw-semibold">Вес:</span> ${item.weight} кг</div>`;
  if (item.capacity) contentHtml += `<div><span class="fw-semibold">Вместимость:</span> ${item.capacity}</div>`;
  if (item.event) contentHtml += `<div><span class="fw-semibold">Ивент:</span> <span class="text-info">${item.event}</span></div>`;

  contentHtml += `<hr class="my-1"><p class="mb-0 small">${item.description || 'Нет описания'}</p>`;
  contentHtml += `</div>`;

  // Создаем новый Popover
  const popover = new bootstrap.Popover(currentButton, {
    content: contentHtml,
    html: true,
    placement: 'right',
    trigger: 'manual',
    customClass: 'item-popover',
  });

  popover.show();

  // Функция для закрытия этого конкретного поповера при клике вне его
  function closeThisPopover(e) {
    // Проверяем, кликнули ли вне поповера и не по кнопке, которая его вызвала
    if (!currentButton.contains(e.target) && !e.target.closest('.popover')) {
      const popoverInstance = bootstrap.Popover.getInstance(currentButton);
      if (popoverInstance) {
        popoverInstance.dispose();
      }
      document.removeEventListener('click', closeThisPopover);
    }
  }

  // Добавляем обработчик для закрытия при клике вне поповера
  setTimeout(() => {
    document.addEventListener('click', closeThisPopover);
  }, 100);

  popover.update();
}

/**
 * Закрывает все popover при клике на пустое место
 */
document.addEventListener('click', function(e) {
  // Если кликнули не на кнопке с предметом и не на popover'е
  if (!e.target.closest('.items-tab-box') && !e.target.closest('.popover')) {
    closeAllPopovers();
  }
});


// --- Инициализация приложения ---
function initApp() {
  if (!itemsData.length) {
    console.error('Нет данных для отображения');
    return;
  }

  buildCategoriesMenu();
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      filterAndRenderItems();
      // Закрываем popover при поиске
      closeAllPopovers();
    });
  }

  filterAndRenderItems();

  // Инициализируем тултипы Bootstrap
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  if (tooltipTriggerList.length > 0) {
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
  }
}

// Запускаем приложение после полной загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
