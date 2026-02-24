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

if (typeof itemsDatabase === 'undefined') {
  console.error('Ошибка: База данных itemsDatabase не найдена!');
} else {
  console.log(`База данных предметов загружена. Всего предметов: ${itemsDatabase.length}`);
}

if (typeof vehiclesDatabase === 'undefined') {
  console.error('Ошибка: База данных vehiclesDatabase не найдена!');
} else {
  console.log(`База данных ТС загружена. Всего ТС: ${vehiclesDatabase.length}`);
}

const TOTAL_ITEMS_IN_GAME = 803+50+174+127;

let currentCategory = 'Все предметы';
let currentEvent = 'Все ивенты';
let currentSearchTerm = '';
let itemsData = itemsDatabase || [];

const categoriesNav = document.getElementById('categoriesNav');
const eventsNav = document.getElementById('eventsNav');
const itemsGrid = document.querySelector('.items-tab-grid');
const searchInput = document.querySelector('.ph-search .form-control');
const placeholderText = document.querySelector('.ph-placeholder');

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

function addStatsToSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  
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
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function getCategoriesFromItems() {
  if (!itemsData.length) return ['Все предметы'];

  const types = itemsData.map(item => item.type);
  const nonEmptyTypes = types.filter(type => type && type.trim() !== '');
  const uniqueTypes = [...new Set(nonEmptyTypes)];
  uniqueTypes.sort();
  
  let result = ['Все предметы', ...uniqueTypes];
  
  const wheelCategories = uniqueTypes.filter(type => type.includes('колеса'));
  if (wheelCategories.length > 0 && !result.includes('Все колеса')) {
    const allIndex = result.indexOf('Все предметы');
    result.splice(allIndex + 1, 0, 'Все колеса');
  }
  
  const hasEmptyCategory = itemsData.some(item => !item.type || item.type.trim() === '');
  if (hasEmptyCategory && !result.includes('Без категории')) {
    const allIndex = result.indexOf('Все предметы');
    result.splice(allIndex + 1, 0, 'Без категории');
  }
  
  return result;
}

function getEventsFromItems() {
  if (!itemsData.length) return ['Все ивенты'];

  const events = itemsData
    .map(item => item.event)
    .filter(event => event && event.trim() !== '');
  const uniqueEvents = [...new Set(events)];
  uniqueEvents.sort((a, b) => {
    const dateMatchA = a.match(/\d{4}/);
    const dateMatchB = b.match(/\d{4}/);
    if (dateMatchA && dateMatchB) {
      return parseInt(dateMatchB[0]) - parseInt(dateMatchA[0]);
    }
    return a.localeCompare(b);
  });
  return ['Все ивенты', ...uniqueEvents];
}

function buildCategoriesMenu() {
  if (!categoriesNav || !itemsData.length) return;

  const categories = getCategoriesFromItems();
  categoriesNav.innerHTML = '';

  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'nav-link';
    if (category === currentCategory) {
      button.classList.add('active');
    }

    let itemCount;
    if (category === 'Все предметы') {
      itemCount = itemsData.length;
    } else if (category === 'Все колеса') {
      itemCount = itemsData.filter(item => item.type && item.type.includes('колеса')).length;
    } else if (category === 'Без категории') {
      itemCount = itemsData.filter(item => !item.type || item.type.trim() === '').length;
    } else {
      itemCount = itemsData.filter(item => item.type === category).length;
    }

    button.innerHTML = `
      <span${category === 'Без категории' ? ' style="color: #dc3545;"' : ''}>${category}</span>
      <span class="ms-auto">${itemCount}</span>
    `;

    button.addEventListener('click', () => {
      document.querySelectorAll('#categoriesNav .nav-link').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentCategory = category;
      filterAndRenderItems();
      closeAllPopovers();
    });

    categoriesNav.appendChild(button);
  });
}

function buildEventsMenu() {
  if (!eventsNav || !itemsData.length) return;

  const events = getEventsFromItems();
  eventsNav.innerHTML = '';

  events.forEach(event => {
    const button = document.createElement('button');
    button.className = 'nav-link';
    if (event === currentEvent) {
      button.classList.add('active');
    }

    let itemCount;
    if (event === 'Все ивенты') {
      itemCount = itemsData.length;
    } else {
      itemCount = itemsData.filter(item => item.event === event).length;
    }

    button.innerHTML = `
      <span>${event}</span>
      <span class="ms-auto">${itemCount}</span>
    `;

    button.addEventListener('click', () => {
      document.querySelectorAll('#eventsNav .nav-link').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentEvent = event;
      filterAndRenderItems();
      closeAllPopovers();
    });

    eventsNav.appendChild(button);
  });
}

function getItemIconPath(item) {
  if (item.badgeImage) {
    if (item.badgeImage.startsWith('Винилы/')) {
      return `icons/${item.badgeImage}`;
    }
    return `icons/${item.badgeImage}`;
  }
  
  return `icons/${item.id}.png`;
}

function closeAllPopovers() {
  document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
    const pop = bootstrap.Popover.getInstance(el);
    if (pop) {
      pop.dispose();
    }
  });
  
  document.querySelectorAll('.popover').forEach(popover => popover.remove());
}

function getFilteredItems() {
  if (!itemsData.length) return [];

  let filtered = itemsData;

  if (currentCategory === 'Без категории') {
    filtered = filtered.filter(item => !item.type || item.type.trim() === '');
  } else if (currentCategory === 'Все колеса') {
    filtered = filtered.filter(item => item.type && item.type.includes('колеса'));
  } else if (currentCategory !== 'Все предметы') {
    filtered = filtered.filter(item => item.type === currentCategory);
  }

  if (currentEvent !== 'Все ивенты') {
    filtered = filtered.filter(item => item.event === currentEvent);
  }

  if (currentSearchTerm.trim() !== '') {
    const searchLower = currentSearchTerm.toLowerCase();
    filtered = filtered.filter(item => {
      return (item.id && item.id.toString().includes(searchLower)) ||
             (item.name && item.name.toLowerCase().includes(searchLower)) ||
             (item.description && item.description.toLowerCase().includes(searchLower)) ||
             (item.event && item.event.toLowerCase().includes(searchLower));
    });
  }

  return filtered;
}

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
    
    if (!item.type || item.type.trim() === '') {
      itemButton.classList.add('uncategorized');
    }
    
    itemButton.dataset.itemId = item.id;
    if (item.badgeImage) {
      itemButton.dataset.badgeImage = item.badgeImage;
    }

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

    if (item.tool === true) {
      const wrenchIcon = document.createElement('i');
      wrenchIcon.setAttribute('data-lucide', 'wrench');
      wrenchIcon.classList.add('item-tool');
      container.appendChild(wrenchIcon);
    }

    if (item.protected === true) {
      const shieldIcon = document.createElement('i');
      shieldIcon.setAttribute('data-lucide', 'shield');
      container.appendChild(shieldIcon);
    }

    itemButton.appendChild(container);
    itemButton.addEventListener('click', (event) => showItemPopover(event, item));

    itemsGrid.appendChild(itemButton);
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function updateMobileCategoryButtonText() {
  const mobileCategoryBtn = document.getElementById('mobileCategoryDropdown');
  if (mobileCategoryBtn) {
    mobileCategoryBtn.textContent = `Категория: ${currentCategory}`;
  }
}

function updateMobileEventButtonText() {
  const mobileEventBtn = document.getElementById('mobileEventDropdown');
  if (mobileEventBtn) {
    mobileEventBtn.textContent = `Ивент: ${currentEvent}`;
  }
}

function buildMobileCategoriesMenu() {
  const mobileCategoriesMenu = document.getElementById('mobileCategoriesMenu');
  if (!mobileCategoriesMenu || !itemsData.length) return;

  const categories = getCategoriesFromItems();
  mobileCategoriesMenu.innerHTML = '';

  categories.forEach(category => {
    const button = document.createElement('li');
    const itemLink = document.createElement('button');
    itemLink.className = 'dropdown-item';
    if (category === currentCategory) {
      itemLink.classList.add('active');
    }

    let itemCount;
    if (category === 'Все предметы') {
      itemCount = itemsData.length;
    } else if (category === 'Все колеса') {
      itemCount = itemsData.filter(item => item.type && item.type.includes('колеса')).length;
    } else if (category === 'Без категории') {
      itemCount = itemsData.filter(item => !item.type || item.type.trim() === '').length;
    } else {
      itemCount = itemsData.filter(item => item.type === category).length;
    }

    itemLink.innerHTML = `
      <span${category === 'Без категории' ? ' style="color: #dc3545;"' : ''}>${category}</span>
      <span class="ms-auto">${itemCount}</span>
    `;

    itemLink.addEventListener('click', () => {
      document.querySelectorAll('#mobileCategoriesMenu .dropdown-item').forEach(btn => btn.classList.remove('active'));
      itemLink.classList.add('active');
      currentCategory = category;
      filterAndRenderItems();
      closeAllPopovers();
    });

    button.appendChild(itemLink);
    mobileCategoriesMenu.appendChild(button);
  });
}

function buildMobileEventsMenu() {
  const mobileEventsMenu = document.getElementById('mobileEventsMenu');
  if (!mobileEventsMenu || !itemsData.length) return;

  const events = getEventsFromItems();
  mobileEventsMenu.innerHTML = '';

  events.forEach(event => {
    const button = document.createElement('li');
    const itemLink = document.createElement('button');
    itemLink.className = 'dropdown-item';
    if (event === currentEvent) {
      itemLink.classList.add('active');
    }

    let itemCount;
    if (event === 'Все ивенты') {
      itemCount = itemsData.length;
    } else {
      itemCount = itemsData.filter(item => item.event === event).length;
    }

    itemLink.innerHTML = `
      <span>${event}</span>
      <span class="ms-auto">${itemCount}</span>
    `;

    itemLink.addEventListener('click', () => {
      document.querySelectorAll('#mobileEventsMenu .dropdown-item').forEach(btn => btn.classList.remove('active'));
      itemLink.classList.add('active');
      currentEvent = event;
      filterAndRenderItems();
      closeAllPopovers();
    });

    button.appendChild(itemLink);
    mobileEventsMenu.appendChild(button);
  });
}

function filterAndRenderItems() {
  const filteredItems = getFilteredItems();
  renderItemsGrid(filteredItems);
  
  if (placeholderText) {
    let totalInFilters = itemsData.length;
    if (currentCategory !== 'Все предметы' && currentCategory !== 'Без категории' && currentCategory !== 'Все колеса') {
      totalInFilters = itemsData.filter(i => i.type === currentCategory).length;
    } else if (currentCategory === 'Без категории') {
      totalInFilters = itemsData.filter(i => !i.type || i.type.trim() === '').length;
    } else if (currentCategory === 'Все колеса') {
      totalInFilters = itemsData.filter(i => i.type && i.type.includes('колеса')).length;
    }
    if (currentEvent !== 'Все ивенты') {
      const eventFiltered = itemsData.filter(i => i.event === currentEvent);
      totalInFilters = eventFiltered.length;
    }
    placeholderText.placeholder = `Поиск ${filteredItems.length} из ${totalInFilters} предметов...`;
  }

  updateMobileCategoryButtonText();
  updateMobileEventButtonText();
}

function showItemPopover(event, item) {
  const currentButton = event.currentTarget;
  const existingPopover = bootstrap.Popover.getInstance(currentButton);
  
  if (existingPopover) {
    existingPopover.dispose();
    return;
  }
  
  closeAllPopovers();

  let contentHtml = `
    <div style="text-align: left; font-size: 0.9rem; min-width: 200px;">
      <strong>${item.name}</strong><br>
      <span class="text-secondary">ID: ${item.id}</span><br>
      <hr class="my-1">
  `;

  if (item.type) contentHtml += `<div><span class="fw-semibold">Категория:</span> ${item.type}</div>`;
  if (item.health) contentHtml += `<div><span class="fw-semibold">Здоровье:</span> +${item.health}</div>`;
  if (item.food) contentHtml += `<div><span class="fw-semibold">Еда:</span> +${item.food}</div>`;
  if (item.weight) contentHtml += `<div><span class="fw-semibold">Вес:</span> ${item.weight} кг</div>`;
  if (item.capacity) contentHtml += `<div><span class="fw-semibold">Вместимость:</span> ${item.capacity}</div>`;
  if (item.event) contentHtml += `<div><span class="fw-semibold">Ивент:</span> <span class="text-info">${item.event}</span></div>`;

  contentHtml += `<hr class="my-1"><p class="mb-0 small">${item.description || 'Нет описания'}</p>`;
  contentHtml += `</div>`;

  const popover = new bootstrap.Popover(currentButton, {
    content: contentHtml,
    html: true,
    placement: 'right',
    trigger: 'manual',
    customClass: 'item-popover',
  });

  popover.show();

  function closeThisPopover(e) {
    if (!currentButton.contains(e.target) && !e.target.closest('.popover')) {
      const popoverInstance = bootstrap.Popover.getInstance(currentButton);
      if (popoverInstance) {
        popoverInstance.dispose();
      }
      document.removeEventListener('click', closeThisPopover);
    }
  }

  setTimeout(() => {
    document.addEventListener('click', closeThisPopover);
  }, 100);

  popover.update();
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.items-tab-box') && !e.target.closest('.popover')) {
    closeAllPopovers();
  }
});

function updateMobileFilters() {
  updateMobileCategoryButtonText();
  updateMobileEventButtonText();
  buildMobileCategoriesMenu();
  buildMobileEventsMenu();
}

function initApp() {
  if (!itemsData.length) {
    console.error('Нет данных для отображения');
    return;
  }

  buildCategoriesMenu();
  buildEventsMenu();
  addStatsToSidebar();
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      filterAndRenderItems();
      closeAllPopovers();
    });
  }

  filterAndRenderItems();

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  if (tooltipTriggerList.length > 0) {
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
  }

  updateMobileFilters();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

const itemBoard = document.getElementById('itemBoard');
const boardWrapper = document.getElementById('boardWrapper');
const itemSearchInput = document.getElementById('itemSearchInput');
const searchResults = document.getElementById('searchResults');
const stackingCheckbox = document.getElementById('stackingCheckbox');
const generatedTextBlock = document.getElementById('generatedTextBlock');
const copyTextBtn = document.getElementById('copyTextBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadDropdown = document.getElementById('downloadDropdown');
const toggleBoardTheme = document.getElementById('toggleBoardTheme');
const boardItemsCounter = document.getElementById('boardItemsCounter');
const totalItemsCount = document.getElementById('totalItemsCount');

let boardItems = [];
let draggingElement = null;
let boardTheme = 'light';

const MAX_BOARD_ITEMS = 25;

function syncBoardThemeWithPageTheme() {
    const currentPageTheme = htmlElement.getAttribute('data-bs-theme') || 'light';
    boardTheme = currentPageTheme;
    
    if (itemBoard) {
        itemBoard.setAttribute('data-board-theme', boardTheme);
    }
    
    updateBoardThemeButtonIcon();
}

function updateBoardThemeButtonIcon() {
    if (!toggleBoardTheme) return;
    
    const icon = toggleBoardTheme.querySelector('[data-lucide]');
    if (icon) {
        const iconName = boardTheme === 'light' ? 'moon' : 'sun';
        icon.setAttribute('data-lucide', iconName);
        
        const buttonText = boardTheme === 'light' ? 'Тёмная тема доски' : 'Светлая тема доски';
        const textNode = Array.from(toggleBoardTheme.childNodes).find(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        );
        
        if (textNode) {
            textNode.textContent = buttonText;
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

function toggleBoardThemeHandler() {
    boardTheme = boardTheme === 'light' ? 'dark' : 'light';
    
    if (itemBoard) {
        itemBoard.setAttribute('data-board-theme', boardTheme);
    }
    
    updateBoardThemeButtonIcon();
    localStorage.setItem('boardTheme', boardTheme);
}

function initBoard() {
  if (!itemBoard || !itemSearchInput) return;
  
  if (totalItemsCount) {
    totalItemsCount.textContent = itemsData.length;
  }
  
  syncBoardThemeWithPageTheme();
  
  const savedBoardTheme = localStorage.getItem('boardTheme');
  if (savedBoardTheme && (savedBoardTheme === 'light' || savedBoardTheme === 'dark')) {
    boardTheme = savedBoardTheme;
    if (itemBoard) {
      itemBoard.setAttribute('data-board-theme', boardTheme);
    }
    updateBoardThemeButtonIcon();
  }
  
  updateSearchResults('');
  
  itemSearchInput.addEventListener('input', debounce((e) => {
    updateSearchResults(e.target.value);
  }, 300));
  
  stackingCheckbox.addEventListener('change', updateBoard);
  
  copyTextBtn.addEventListener('click', copyGeneratedText);
  
  downloadBtn.addEventListener('click', () => downloadBoard('png'));
  
  downloadDropdown.addEventListener('click', (e) => {
    const format = e.target.dataset.format;
    if (format) {
      downloadBoard(format);
    }
  });
  
  toggleBoardTheme.addEventListener('click', toggleBoardThemeHandler);
  
  renderBoard();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function updateSearchResults(query) {
  if (!searchResults) return;
  
  let filtered = itemsData;
  
  if (query.trim() !== '') {
    const searchLower = query.toLowerCase();
    filtered = itemsData.filter(item => {
      return (item.name && item.name.toLowerCase().includes(searchLower)) ||
             (item.id && item.id.toString().includes(searchLower)) ||
             (item.type && item.type.toLowerCase().includes(searchLower));
    });
  }
  
  const results = filtered.slice(0, 10);
  
  searchResults.innerHTML = '';
  
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="text-center text-secondary p-3">Ничего не найдено</div>';
    return;
  }
  
  results.forEach(item => {
    const resultItem = createSearchResultItem(item);
    searchResults.appendChild(resultItem);
  });
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function createSearchResultItem(item) {
  const container = document.createElement('div');
  container.className = 'search-result-item';
  
  const iconPath = getItemIconPath(item);
  
  container.innerHTML = `
    <img src="${iconPath}" alt="${item.name || 'Предмет'}" onerror="this.src='icons/placeholder.png'">
    <div class="item-info">
      <div class="fw-semibold">${item.name}</div>
      <div class="smaller text-secondary">#${item.id} · ${item.type || 'Без категории'}</div>
    </div>
    <div class="item-actions">
      <button class="btn btn-sm btn-outline-primary add-btn" data-item-id="${item.id}">
        <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
      </button>
    </div>
  `;
  
  const addBtn = container.querySelector('.add-btn');
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    addItemToBoard(item);
  });
  
  return container;
}

function addItemToBoard(item) {
  if (!item) return;
  
  if (item.tool === true || item.protected === true) {
    alert('Фракционные и рабочие предметы нельзя добавлять на доску объявлений');
    return;
  }
  
  const isStacking = stackingCheckbox.checked;
  
  if (isStacking) {
    const existingIndex = boardItems.findIndex(bi => bi.item.id === item.id);
    
    if (existingIndex !== -1) {
      boardItems[existingIndex].count++;
    } else {
      if (boardItems.length >= MAX_BOARD_ITEMS) {
        alert(`Достигнут лимит карточек (максимум ${MAX_BOARD_ITEMS})`);
        return;
      }
      boardItems.push({ item, count: 1 });
    }
  } else {
    if (boardItems.length >= MAX_BOARD_ITEMS) {
      alert(`Достигнут лимит карточек (максимум ${MAX_BOARD_ITEMS})`);
      return;
    }
    boardItems.push({ item, count: 1 });
  }
  
  renderBoard();
  updateGeneratedText();
}

function removeItemFromBoard(index) {
  if (index >= 0 && index < boardItems.length) {
    boardItems.splice(index, 1);
    renderBoard();
    updateGeneratedText();
  }
}

function renderBoard() {
  if (!itemBoard) return;
  
  itemBoard.innerHTML = '';
  
  boardItems.forEach((boardItem, index) => {
    const item = boardItem.item;
    const count = boardItem.count;
    
    const card = document.createElement('div');
    card.className = 'board-item';
    card.dataset.index = index;
    card.draggable = true;
    
    const iconPath = getItemIconPath(item);
    
    const img = document.createElement('img');
    img.src = iconPath;
    img.alt = item.name || 'Предмет';
    img.onerror = () => {
      img.src = 'icons/placeholder.png';
    };
    
    card.appendChild(img);
    
    if (stackingCheckbox.checked && count > 1) {
      const countSpan = document.createElement('span');
      countSpan.className = 'item-count';
      countSpan.textContent = count + ' шт';
      card.appendChild(countSpan);
    }
    
    if (item.tool === true) {
      const wrenchIcon = document.createElement('i');
      wrenchIcon.setAttribute('data-lucide', 'wrench');
      wrenchIcon.classList.add('item-tool');
      card.appendChild(wrenchIcon);
    }
    
    if (item.protected === true) {
      const shieldIcon = document.createElement('i');
      shieldIcon.setAttribute('data-lucide', 'shield');
      shieldIcon.className = 'item-protected';
      card.appendChild(shieldIcon);
    }
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-item';
    removeBtn.innerHTML = '×';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeItemFromBoard(index);
    });
    card.appendChild(removeBtn);
    
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    
    itemBoard.appendChild(card);
  });
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  if (boardItemsCounter) {
    boardItemsCounter.textContent = `${boardItems.length}/${MAX_BOARD_ITEMS}`;
  }
}

function handleDragStart(e) {
  draggingElement = this;
  this.classList.add('dragging');
  e.dataTransfer.setData('text/plain', this.dataset.index);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggingElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
  
  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
  const toIndex = parseInt(this.dataset.index);
  
  if (fromIndex !== toIndex) {
    const [movedItem] = boardItems.splice(fromIndex, 1);
    boardItems.splice(toIndex, 0, movedItem);
    
    renderBoard();
  }
}

function updateGeneratedText() {
  if (!generatedTextBlock) return;
  
  if (boardItems.length === 0) {
    generatedTextBlock.textContent = 'Доска пуста';
    return;
  }
  
  let text = 'ПРОДАМ:\n';
  
  boardItems.forEach(boardItem => {
    const item = boardItem.item;
    const count = boardItem.count;
    text += `- ${item.name} — ${count} шт\n`;
  });
  
  generatedTextBlock.textContent = text;
}

function copyGeneratedText() {
  if (!generatedTextBlock || !generatedTextBlock.textContent) return;
  
  navigator.clipboard.writeText(generatedTextBlock.textContent).then(() => {
    const originalText = copyTextBtn.innerHTML;
    copyTextBtn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px;"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setTimeout(() => {
      copyTextBtn.innerHTML = originalText;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 2000);
  }).catch(err => {
    console.error('Ошибка копирования:', err);
  });
}

async function downloadBoard(format = 'png') {
  if (!boardWrapper) return;
  
  const exportBoard = document.createElement('div');
  exportBoard.className = 'board-grid';
  exportBoard.setAttribute('data-board-theme', boardTheme);
  
  const boardWidth = 692;
  const boardHeight = 692;
  
  exportBoard.style.width = boardWidth + 'px';
  exportBoard.style.height = boardHeight + 'px';
  exportBoard.style.padding = '70px';
  exportBoard.style.gap = '18px';
  exportBoard.style.display = 'grid';
  exportBoard.style.gridTemplateColumns = 'repeat(5, 1fr)';
  exportBoard.style.gridTemplateRows = 'repeat(5, 1fr)';
  
  exportBoard.style.position = 'absolute';
  exportBoard.style.left = '-9999px';
  exportBoard.style.top = '-9999px';
  exportBoard.style.boxSizing = 'border-box';
  
  const loadImagePromises = [];
  
  for (const boardItem of boardItems) {
    const item = boardItem.item;
    const count = boardItem.count;
    
    const card = document.createElement('div');
    card.className = 'board-item';
    
    const iconPath = getItemIconPath(item);
    
    const imgPromise = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = iconPath;
      img.style.width = '48px';
      img.style.height = '48px';
      img.style.objectFit = 'contain';
      
      img.onload = () => {
        card.appendChild(img);
        resolve();
      };
      
      img.onerror = () => {
        img.src = 'icons/placeholder.png';
        img.onload = () => {
          card.appendChild(img);
          resolve();
        };
      };
    });
    
    loadImagePromises.push(imgPromise);
    
    if (stackingCheckbox.checked && count > 1) {
      const countSpan = document.createElement('span');
      countSpan.className = 'item-count';
      countSpan.textContent = count + ' шт';
      card.appendChild(countSpan);
    }
    
    if (item.tool === true) {
      const wrenchIcon = document.createElement('i');
      wrenchIcon.setAttribute('data-lucide', 'wrench');
      wrenchIcon.className = 'item-tool';
      card.appendChild(wrenchIcon);
    }
    
    if (item.protected === true) {
      const shieldIcon = document.createElement('i');
      shieldIcon.setAttribute('data-lucide', 'shield');
      shieldIcon.className = 'item-protected';
      card.appendChild(shieldIcon);
    }
    
    exportBoard.appendChild(card);
  }
  
  document.body.appendChild(exportBoard);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  await Promise.all(loadImagePromises);
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
    const canvas = await html2canvas(exportBoard, {
      scale: 2,
      backgroundColor: boardTheme === 'light' ? '#E6E6E6' : '#0D0D0D',
      allowTaint: false,
      useCORS: true,
      logging: false,
      windowWidth: boardWidth,
      windowHeight: boardHeight,
    });
    
    const link = document.createElement('a');
    link.download = `board.${format}`;
    
    let imageData;
    if (format === 'jpeg') {
      imageData = canvas.toDataURL('image/jpeg', 0.95);
    } else if (format === 'webp') {
      imageData = canvas.toDataURL('image/webp', 0.95);
    } else {
      imageData = canvas.toDataURL('image/png');
    }
    
    link.href = imageData;
    link.click();
    
  } catch (error) {
    console.error('Ошибка при создании изображения:', error);
    alert('Не удалось создать изображение. Попробуй другой формат или обнови страницу.');
  } finally {
    document.body.removeChild(exportBoard);
  }
}

function updateBoard() {
  if (!stackingCheckbox.checked) {
    const newBoardItems = [];
    boardItems.forEach(boardItem => {
      for (let i = 0; i < boardItem.count; i++) {
        if (newBoardItems.length < MAX_BOARD_ITEMS) {
          newBoardItems.push({ item: boardItem.item, count: 1 });
        }
      }
    });
    boardItems = newBoardItems;
  } else {
    const itemMap = new Map();
    boardItems.forEach(boardItem => {
      const key = boardItem.item.id;
      if (itemMap.has(key)) {
        itemMap.get(key).count += boardItem.count;
      } else {
        itemMap.set(key, { item: boardItem.item, count: boardItem.count });
      }
    });
    boardItems = Array.from(itemMap.values());
  }
  
  renderBoard();
  updateGeneratedText();
}

let vehicleBoardTheme = 'light';
const vehicleBoard = document.getElementById('vehicleBoard');
const toggleVehicleBoardTheme = document.getElementById('toggleVehicleBoardTheme');
const downloadVehicleBtn = document.getElementById('downloadVehicleBtn');
const downloadVehicleDropdown = document.getElementById('downloadVehicleDropdown');

const vehicleCustomSelect = document.getElementById('vehicleCustomSelect');
const vehicleSearchInput = document.getElementById('vehicleSearchInput');
const vehicleDropdown = document.getElementById('vehicleDropdown');
const vehicleSelectedId = document.getElementById('vehicleSelectedId');
const vehicleSelectedName = document.getElementById('vehicleSelectedName');

const locationCustomSelect = document.getElementById('locationCustomSelect');
const locationSearchInput = document.getElementById('locationSearchInput');
const locationDropdown = document.getElementById('locationDropdown');
const locationSelectedValue = document.getElementById('locationSelectedValue');

const vehiclePrice = document.getElementById('vehiclePrice');
const showPriceBadge = document.getElementById('showPriceBadge');
const sellerNickname = document.getElementById('sellerNickname');
const phoneNumber = document.getElementById('phoneNumber');
const showTimePeriod = document.getElementById('showTimePeriod');
const mileage = document.getElementById('mileage');
const color = document.getElementById('color');
const owners = document.getElementById('owners');
const ownership = document.getElementById('ownership');
const plate = document.getElementById('plate');
const chipBase = document.getElementById('chipBase');
const chipSlot2 = document.getElementById('chipSlot2');
const chipSlot3 = document.getElementById('chipSlot3');
const chipSlot4 = document.getElementById('chipSlot4');
const tuning = document.getElementById('tuning');
const vinylSelect = document.getElementById('vinylSelect');
const frameSelect = document.getElementById('frameSelect');
const imageUpload = document.getElementById('imageUpload');
const imageCountMessage = document.getElementById('imageCountMessage');

const boardVehicleName = document.getElementById('boardVehicleName');
const boardVehiclePrice = document.getElementById('boardVehiclePrice');
const boardVehicleBadge = document.getElementById('boardVehicleBadge');
const boardAuthorNickname = document.getElementById('boardAuthorNickname');
const boardAuthorLocation = document.getElementById('boardAuthorLocation');
const boardContactBlock = document.getElementById('boardContactBlock');
const boardPhoneNumber = document.getElementById('boardPhoneNumber');
const boardTimePeriod = document.getElementById('boardTimePeriod');
const boardMileage = document.getElementById('boardMileage');
const boardColor = document.getElementById('boardColor');
const boardDrive = document.getElementById('boardDrive');
const boardSteering = document.getElementById('boardSteering');
const boardCondition = document.getElementById('boardCondition');
const boardOwners = document.getElementById('boardOwners');
const boardOwnership = document.getElementById('boardOwnership');
const boardPlate = document.getElementById('boardPlate');
const boardTuningChip = document.getElementById('boardTuningChip');
const boardTuning = document.getElementById('boardTuning');
const boardVinyl = document.getElementById('boardVinyl');
const boardFrame = document.getElementById('boardFrame');
const boardMainImage = document.getElementById('boardMainImage');
const boardThumbnailsBox = document.getElementById('boardThumbnailsBox');

function createPlaceholderImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#4a4a4a';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Нет картинки', canvas.width/2, canvas.height/2);
    
    return canvas.toDataURL();
}

const PLACEHOLDER_IMAGE = createPlaceholderImage();

function syncVehicleBoardThemeWithPageTheme() {
    const currentPageTheme = htmlElement.getAttribute('data-bs-theme') || 'light';
    vehicleBoardTheme = currentPageTheme;
    
    if (vehicleBoard) {
        vehicleBoard.setAttribute('data-board-theme', vehicleBoardTheme);
    }
    
    updateVehicleBoardThemeButtonIcon();
}

function updateVehicleBoardThemeButtonIcon() {
    if (!toggleVehicleBoardTheme) return;
    
    const icon = toggleVehicleBoardTheme.querySelector('[data-lucide]');
    if (icon) {
        const iconName = vehicleBoardTheme === 'light' ? 'moon' : 'sun';
        icon.setAttribute('data-lucide', iconName);
        
        const buttonText = vehicleBoardTheme === 'light' ? 'Тёмная тема доски' : 'Светлая тема доски';
        const textNode = Array.from(toggleVehicleBoardTheme.childNodes).find(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        );
        
        if (textNode) {
            textNode.textContent = buttonText;
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

function toggleVehicleBoardThemeHandler() {
    vehicleBoardTheme = vehicleBoardTheme === 'light' ? 'dark' : 'light';
    
    if (vehicleBoard) {
        vehicleBoard.setAttribute('data-board-theme', vehicleBoardTheme);
    }
    
    updateVehicleBoardThemeButtonIcon();
    localStorage.setItem('vehicleBoardTheme', vehicleBoardTheme);
}

function formatNumberWithSpaces(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatPhoneNumber(value) {
    let numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length > 11) numbers = numbers.slice(0, 11);
    
    if (numbers.length <= 1) return `+${numbers}`;
    if (numbers.length <= 4) return `+${numbers.slice(0, 1)} ${numbers.slice(1)}`;
    if (numbers.length <= 7) return `+${numbers.slice(0, 1)} ${numbers.slice(1, 4)} ${numbers.slice(4)}`;
    if (numbers.length <= 9) return `+${numbers.slice(0, 1)} ${numbers.slice(1, 4)} ${numbers.slice(4, 7)}-${numbers.slice(7)}`;
    return `+${numbers.slice(0, 1)} ${numbers.slice(1, 4)} ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`;
}

function pluralizeOwners(count) {
    count = parseInt(count) || 0;
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return 'владельцев';
    }
    
    if (lastDigit === 1) {
        return 'владелец';
    }
    
    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'владельца';
    }
    
    return 'владельцев';
}

function pluralizeDays(count) {
    count = parseInt(count) || 0;
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return 'дней';
    }
    
    if (lastDigit === 1) {
        return 'день';
    }
    
    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'дня';
    }
    
    return 'дней';
}

function closeAllDropdowns() {
    const openDropdowns = document.querySelectorAll('.custom-select-dropdown.show');
    openDropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

function initCustomSelects() {
    if (vehicleCustomSelect) {
        vehicleSearchInput.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = vehicleDropdown.classList.contains('show');
            closeAllDropdowns();
            if (!isOpen) {
                vehicleDropdown.classList.add('show');
                filterVehicleOptions(vehicleSearchInput.value);
            }
        });

        vehicleSearchInput.addEventListener('input', (e) => {
            filterVehicleOptions(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!vehicleCustomSelect.contains(e.target)) {
                vehicleDropdown.classList.remove('show');
            }
        });

        populateVehicleDropdown();
    }

    if (locationCustomSelect) {
        locationSearchInput.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = locationDropdown.classList.contains('show');
            closeAllDropdowns();
            if (!isOpen) {
                locationDropdown.classList.add('show');
                filterLocationOptions(locationSearchInput.value);
            }
        });

        locationSearchInput.addEventListener('input', (e) => {
            filterLocationOptions(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!locationCustomSelect.contains(e.target)) {
                locationDropdown.classList.remove('show');
            }
        });

        populateLocationDropdown();
    }
}

function populateVehicleDropdown() {
    if (!vehicleDropdown || !vehiclesDatabase) return;
    
    vehicleDropdown.innerHTML = '';
    
    const placeholderItem = document.createElement('button');
    placeholderItem.type = 'button';
    placeholderItem.className = 'dropdown-item';
    placeholderItem.setAttribute('data-value', '');
    placeholderItem.setAttribute('data-name', '');
    placeholderItem.textContent = 'Выберите ТС...';
    placeholderItem.style.color = 'var(--bs-secondary)';
    placeholderItem.style.fontStyle = 'italic';
    
    placeholderItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        document.querySelectorAll('#vehicleDropdown .dropdown-item').forEach(el => {
            el.classList.remove('active');
        });
        placeholderItem.classList.add('active');
        
        vehicleSearchInput.value = '';
        vehicleSelectedId.value = '';
        vehicleSelectedName.value = '';
        
        vehicleDropdown.classList.remove('show');
        
        if (typeof updateVehicleBoard === 'function') {
            updateVehicleBoard();
        }
    });
    
    vehicleDropdown.appendChild(placeholderItem);
    
    vehiclesDatabase.forEach(vehicle => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'dropdown-item';
        item.setAttribute('data-value', vehicle.id);
        item.setAttribute('data-name', vehicle.name);
        item.textContent = vehicle.name;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            document.querySelectorAll('#vehicleDropdown .dropdown-item').forEach(el => {
                el.classList.remove('active');
            });
            item.classList.add('active');
            
            vehicleSearchInput.value = item.getAttribute('data-name');
            vehicleSelectedId.value = item.getAttribute('data-value');
            vehicleSelectedName.value = item.getAttribute('data-name');
            
            vehicleDropdown.classList.remove('show');
            
            if (typeof updateVehicleBoard === 'function') {
                updateVehicleBoard();
            }
        });
        
        vehicleDropdown.appendChild(item);
    });
}

function filterVehicleOptions(query) {
    const items = vehicleDropdown.querySelectorAll('.dropdown-item');
    const searchLower = query.toLowerCase().trim();
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchLower) || searchLower === '') {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function populateLocationDropdown() {
    if (!locationDropdown || !locationsDatabase) return;
    
    locationDropdown.innerHTML = '';
    
    const emptyItem = document.createElement('button');
    emptyItem.type = 'button';
    emptyItem.className = 'dropdown-item';
    emptyItem.setAttribute('data-value', '');
    emptyItem.textContent = 'Не указано';
    
    emptyItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        document.querySelectorAll('#locationDropdown .dropdown-item').forEach(el => {
            el.classList.remove('active');
        });
        emptyItem.classList.add('active');
        
        locationSearchInput.value = '';
        locationSelectedValue.value = '';
        
        locationDropdown.classList.remove('show');
        
        if (typeof updateVehicleBoard === 'function') {
            updateVehicleBoard();
        }
    });
    
    locationDropdown.appendChild(emptyItem);
    
    locationsDatabase.forEach(location => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'dropdown-item';
        item.setAttribute('data-value', location);
        item.textContent = location;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            document.querySelectorAll('#locationDropdown .dropdown-item').forEach(el => {
                el.classList.remove('active');
            });
            item.classList.add('active');
            
            locationSearchInput.value = item.getAttribute('data-value');
            locationSelectedValue.value = item.getAttribute('data-value');
            
            locationDropdown.classList.remove('show');
            
            if (typeof updateVehicleBoard === 'function') {
                updateVehicleBoard();
            }
        });
        
        locationDropdown.appendChild(item);
    });
}

function filterLocationOptions(query) {
    const items = locationDropdown.querySelectorAll('.dropdown-item');
    const searchLower = query.toLowerCase().trim();
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchLower) || searchLower === '') {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function populateVinylSelect() {
    if (!vinylSelect || !itemsDatabase) return;
    
    vinylSelect.innerHTML = '<option value="">Без винила</option>';
    
    const vinyls = itemsDatabase.filter(item => item.id === 409 && item.name);
    const uniqueVinyls = [...new Map(vinyls.map(item => [item.name, item])).values()];
    
    uniqueVinyls.sort((a, b) => a.name.localeCompare(b.name));
    
    uniqueVinyls.forEach(vinyl => {
        const option = document.createElement('option');
        option.value = vinyl.name;
        let displayName = vinyl.name.replace(/[«»"']/g, '');
        option.textContent = displayName;
        vinylSelect.appendChild(option);
    });
}

function populateFrameSelect() {
    if (!frameSelect || !itemsDatabase) return;
    
    frameSelect.innerHTML = '<option value="">Стандартная</option>';
    
    const frames = itemsDatabase.filter(item => item.id === 403 && item.name);
    const uniqueFrames = [...new Map(frames.map(item => [item.name, item])).values()];
    
    uniqueFrames.sort((a, b) => a.name.localeCompare(b.name));
    
    uniqueFrames.forEach(frame => {
        const option = document.createElement('option');
        option.value = frame.name;
        option.textContent = frame.name;
        frameSelect.appendChild(option);
    });
}

let uploadedImages = [];

function setPlaceholderImages() {
    boardMainImage.src = PLACEHOLDER_IMAGE;
    boardMainImage.setAttribute('draggable', 'false');
    boardMainImage.removeEventListener('dragstart', handleImageDragStart);
    boardMainImage.removeEventListener('drop', handleImageDrop);
    
    boardThumbnailsBox.style.display = 'grid';
    const thumbnails = boardThumbnailsBox.querySelectorAll('img');
    thumbnails.forEach(img => {
        img.src = PLACEHOLDER_IMAGE;
        img.setAttribute('draggable', 'false');
        img.removeEventListener('dragstart', handleImageDragStart);
        img.removeEventListener('drop', handleImageDrop);
    });
}

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) {
        setPlaceholderImages();
        updateVehicleBoard();
        return;
    }
    
    if (files.length !== 1 && files.length !== 4) {
        imageCountMessage.textContent = '⚠️ Можно выбрать только 1 или 4 изображения';
        imageCountMessage.style.color = '#dc3545';
        e.target.value = '';
        setPlaceholderImages();
        updateVehicleBoard();
        return;
    }
    
    imageCountMessage.textContent = `✅ Выбрано ${files.length} изображений`;
    imageCountMessage.style.color = '#198754';
    
    const imagePromises = files.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    });
    
    Promise.all(imagePromises).then(results => {
        uploadedImages = results;
        displayImages(results);
        updateVehicleBoard();
    });
}

function displayImages(images) {
    if (images.length === 1) {
        boardMainImage.src = images[0];
        boardMainImage.style.objectFit = 'cover';
        boardMainImage.setAttribute('draggable', 'true');
        boardMainImage.dataset.index = '0';
        boardMainImage.addEventListener('dragstart', handleImageDragStart);
        boardMainImage.addEventListener('dragover', (e) => e.preventDefault());
        boardMainImage.addEventListener('drop', handleImageDrop);
        boardThumbnailsBox.style.display = 'none';
    } else {
        boardMainImage.src = images[0];
        boardMainImage.style.objectFit = 'cover';
        boardMainImage.setAttribute('draggable', 'true');
        boardMainImage.dataset.index = '0';
        boardMainImage.addEventListener('dragstart', handleImageDragStart);
        boardMainImage.addEventListener('dragover', (e) => e.preventDefault());
        boardMainImage.addEventListener('drop', handleImageDrop);
        
        boardThumbnailsBox.style.display = 'grid';
        const thumbnails = boardThumbnailsBox.querySelectorAll('img');
        for (let i = 0; i < 3; i++) {
            if (images[i + 1]) {
                thumbnails[i].src = images[i + 1];
                thumbnails[i].style.objectFit = 'cover';
                thumbnails[i].setAttribute('draggable', 'true');
                thumbnails[i].dataset.index = (i + 1).toString();
                thumbnails[i].addEventListener('dragstart', handleImageDragStart);
                thumbnails[i].addEventListener('dragover', (e) => e.preventDefault());
                thumbnails[i].addEventListener('drop', handleImageDrop);
            }
        }
    }
}

function handleImageDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
}

function handleImageDrop(e) {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    let toIndex;
    
    if (e.target === boardMainImage) {
        toIndex = 0;
    } else {
        toIndex = parseInt(e.target.dataset.index);
    }
    
    if (fromIndex !== toIndex && uploadedImages.length === 4) {
        const newImages = [...uploadedImages];
        [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
        uploadedImages = newImages;
        displayImages(newImages);
        updateVehicleBoard();
    }
}

function updateVehicleBoard() {
    const selectedVehicleId = vehicleSelectedId.value;
    const selectedVehicle = vehiclesDatabase.find(v => v.id == selectedVehicleId);
    
    if (selectedVehicle) {
        boardVehicleName.textContent = selectedVehicle.name;
        boardDrive.textContent = selectedVehicle.drive;
        boardSteering.textContent = selectedVehicle.steering;
    } else {
        boardVehicleName.textContent = 'ТС не выбрано';
        boardDrive.textContent = 'Не указан';
        boardSteering.textContent = 'Не указан';
    }
    
    const priceValue = vehiclePrice.value.replace(/\s/g, '');
    if (priceValue && !isNaN(priceValue)) {
        boardVehiclePrice.textContent = `${formatNumberWithSpaces(parseInt(priceValue, 10))} ₽`;
    } else {
        boardVehiclePrice.textContent = '0 ₽';
    }
    
    boardVehicleBadge.style.display = showPriceBadge.checked ? 'inline-block' : 'none';
    
    boardAuthorNickname.textContent = sellerNickname.value || 'Не указано';
    boardAuthorLocation.textContent = locationSelectedValue.value || 'Локация не указана';
    
    if (phoneNumber.value && showTimePeriod.checked) {
        boardContactBlock.style.display = 'flex';
        boardPhoneNumber.textContent = phoneNumber.value;
        boardTimePeriod.textContent = 'с 08:00 до 22:00 МСК';
        boardTimePeriod.style.display = 'block';
    } else if (phoneNumber.value) {
        boardContactBlock.style.display = 'flex';
        boardPhoneNumber.textContent = phoneNumber.value;
        boardTimePeriod.style.display = 'none';
    } else if (showTimePeriod.checked) {
        boardContactBlock.style.display = 'flex';
        boardPhoneNumber.textContent = 'Номер не указан';
        boardTimePeriod.textContent = 'с 08:00 до 22:00 МСК';
        boardTimePeriod.style.display = 'block';
    } else {
        boardContactBlock.style.display = 'none';
    }
    
    if (mileage.value) {
        const mileageValue = mileage.value.replace(/\s/g, '');
        if (!isNaN(mileageValue) && mileageValue !== '') {
            boardMileage.textContent = `${formatNumberWithSpaces(parseInt(mileageValue, 10))} км`;
        }
    } else {
        boardMileage.textContent = 'Не указан';
    }
    
    boardColor.textContent = color.value || 'Не указан';
    
    boardCondition.textContent = 'Не требует ремонта';
    
    const ownersCount = owners.value;
    if (ownersCount) {
        boardOwners.textContent = `${ownersCount} ${pluralizeOwners(ownersCount)}`;
    } else {
        boardOwners.textContent = 'Не указано';
    }
    
    const daysCount = ownership.value;
    if (daysCount) {
        boardOwnership.textContent = `${daysCount} ${pluralizeDays(daysCount)}`;
    } else {
        boardOwnership.textContent = 'Не указано';
    }
    
    boardPlate.textContent = plate.value || 'Без номера';
    
    const chips = [];
    const chipMap = {
        'speed': 'Скорость',
        'balance': 'Баланс',
        'handling': 'Управление'
    };
    
    if (!chipBase.checked) {
        chipSlot2.value = '';
        chipSlot3.value = '';
        chipSlot4.value = '';
        chipSlot2.disabled = true;
        chipSlot3.disabled = true;
        chipSlot4.disabled = true;
        boardTuningChip.textContent = 'Не указана';
    } else {
        chips.push('База');
        chipSlot2.disabled = false;
        
        if (chipSlot2.value) {
            chips.push(chipMap[chipSlot2.value]);
            chipSlot3.disabled = false;
            
            if (chipSlot3.value) {
                chips.push(chipMap[chipSlot3.value]);
                chipSlot4.disabled = false;
                
                if (chipSlot4.value) {
                    chips.push(chipMap[chipSlot4.value]);
                }
            } else {
                chipSlot4.value = '';
                chipSlot4.disabled = true;
            }
        } else {
            chipSlot3.value = '';
            chipSlot4.value = '';
            chipSlot3.disabled = true;
            chipSlot4.disabled = true;
        }
        
        boardTuningChip.textContent = chips.join(' • ');
    }
    
    boardTuning.textContent = tuning.value || 'Не указан';
    
    let vinylName = vinylSelect.value || 'Без винила';
    vinylName = vinylName.replace(/[«»"']/g, '');
    boardVinyl.textContent = vinylName;
    
    boardFrame.textContent = frameSelect.value || 'Стандартная';
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

async function downloadVehicleBoard(format = 'png') {
    if (!vehicleBoard) return;
    
    if (!vehicleSelectedId.value) {
        alert('Выберите транспортное средство');
        return;
    }
    
    if (!sellerNickname.value) {
        alert('Укажите никнейм продавца');
        return;
    }
    
    if (!owners.value) {
        alert('Укажите количество владельцев');
        return;
    }
    
    const scaleFactor = 2;
    const originalWidth = 960;
    
    const exportBoard = vehicleBoard.cloneNode(true);
    exportBoard.style.position = 'absolute';
    exportBoard.style.left = '-9999px';
    exportBoard.style.top = '-9999px';
    exportBoard.style.width = originalWidth + 'px';
    exportBoard.style.height = 'auto';
    exportBoard.style.minHeight = '830px';
    exportBoard.style.transform = 'none';
    exportBoard.style.border = 'none';
    exportBoard.style.outline = 'none';
    exportBoard.style.boxShadow = 'none';
    
    const mainImage = exportBoard.querySelector('#boardMainImage');
    if (mainImage) {
        mainImage.style.border = 'none';
        mainImage.style.outline = 'none';
        mainImage.style.borderRadius = '0';
    }
    
    const thumbnails = exportBoard.querySelectorAll('#boardThumbnailsBox img');
    thumbnails.forEach(thumb => {
        thumb.style.border = 'none';
        thumb.style.outline = 'none';
        thumb.style.borderRadius = '0';
    });
    
    document.body.appendChild(exportBoard);
    
    const loadImagePromises = [];
    
    if (mainImage && mainImage.src) {
        const imgPromise = new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = mainImage.src;
            img.onload = () => resolve();
            img.onerror = () => resolve();
        });
        loadImagePromises.push(imgPromise);
    }
    
    thumbnails.forEach(thumb => {
        if (thumb && thumb.src) {
            const imgPromise = new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = thumb.src;
                img.onload = () => resolve();
                img.onerror = () => resolve();
            });
            loadImagePromises.push(imgPromise);
        }
    });
    
    await Promise.all(loadImagePromises);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
        const canvas = await html2canvas(exportBoard, {
            scale: scaleFactor,
            backgroundColor: vehicleBoardTheme === 'light' ? '#f8f9fa' : '#0D0D0D',
            allowTaint: false,
            useCORS: true,
            logging: false,
            windowWidth: originalWidth,
        });
        
        const link = document.createElement('a');
        link.download = `vehicle.${format}`;
        
        let imageData;
        if (format === 'jpeg') {
            imageData = canvas.toDataURL('image/jpeg', 0.95);
        } else if (format === 'webp') {
            imageData = canvas.toDataURL('image/webp', 0.95);
        } else {
            imageData = canvas.toDataURL('image/png');
        }
        
        link.href = imageData;
        link.click();
        
    } catch (error) {
        console.error('Ошибка при создании изображения:', error);
        alert('Не удалось создать изображение. Попробуй другой формат или обнови страницу.');
    } finally {
        document.body.removeChild(exportBoard);
    }
}

function initVehicleGenerator() {
    if (!vehicleBoard) return;
    
    syncVehicleBoardThemeWithPageTheme();
    
    const savedVehicleBoardTheme = localStorage.getItem('vehicleBoardTheme');
    if (savedVehicleBoardTheme && (savedVehicleBoardTheme === 'light' || savedVehicleBoardTheme === 'dark')) {
        vehicleBoardTheme = savedVehicleBoardTheme;
        if (vehicleBoard) {
            vehicleBoard.setAttribute('data-board-theme', vehicleBoardTheme);
        }
        updateVehicleBoardThemeButtonIcon();
    }
    
    setPlaceholderImages();
    initCustomSelects();
    populateVinylSelect();
    populateFrameSelect();
    
    vehicleSearchInput.value = '';
    vehicleSelectedId.value = '';
    vehicleSelectedName.value = '';
    
    locationSearchInput.value = '';
    locationSelectedValue.value = '';
    
    vehiclePrice.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        if (!isNaN(value) && value !== '') {
            value = parseInt(value, 10);
            e.target.value = formatNumberWithSpaces(value);
        }
        updateVehicleBoard();
    });
    
    showPriceBadge.addEventListener('change', updateVehicleBoard);
    sellerNickname.addEventListener('input', updateVehicleBoard);
    
    phoneNumber.addEventListener('input', function(e) {
        e.target.value = formatPhoneNumber(e.target.value);
        updateVehicleBoard();
    });
    
    showTimePeriod.addEventListener('change', updateVehicleBoard);
    
    mileage.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        if (!isNaN(value) && value !== '') {
            value = parseInt(value, 10);
            e.target.value = formatNumberWithSpaces(value);
        }
        updateVehicleBoard();
    });
    
    color.addEventListener('input', function(e) {
        if (e.target.value) {
            e.target.value = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1);
        }
        updateVehicleBoard();
    });
    
    owners.addEventListener('input', updateVehicleBoard);
    ownership.addEventListener('input', updateVehicleBoard);
    plate.addEventListener('input', updateVehicleBoard);
    
    chipBase.addEventListener('change', function(e) {
        if (!e.target.checked) {
            chipSlot2.value = '';
            chipSlot3.value = '';
            chipSlot4.value = '';
            chipSlot2.disabled = true;
            chipSlot3.disabled = true;
            chipSlot4.disabled = true;
        } else {
            chipSlot2.disabled = false;
        }
        updateVehicleBoard();
    });
    
    chipSlot2.addEventListener('change', function(e) {
        if (e.target.value) {
            chipSlot3.disabled = false;
        } else {
            chipSlot3.value = '';
            chipSlot4.value = '';
            chipSlot3.disabled = true;
            chipSlot4.disabled = true;
        }
        updateVehicleBoard();
    });
    
    chipSlot3.addEventListener('change', function(e) {
        if (e.target.value) {
            chipSlot4.disabled = false;
        } else {
            chipSlot4.value = '';
            chipSlot4.disabled = true;
        }
        updateVehicleBoard();
    });
    
    chipSlot4.addEventListener('change', updateVehicleBoard);
    
    tuning.addEventListener('input', updateVehicleBoard);
    vinylSelect.addEventListener('change', updateVehicleBoard);
    frameSelect.addEventListener('change', updateVehicleBoard);
    imageUpload.addEventListener('change', handleImageUpload);
    
    downloadVehicleBtn.addEventListener('click', () => downloadVehicleBoard('png'));
    
    downloadVehicleDropdown.addEventListener('click', (e) => {
        const format = e.target.dataset.format;
        if (format) {
            downloadVehicleBoard(format);
        }
    });
    
    toggleVehicleBoardTheme.addEventListener('click', toggleVehicleBoardThemeHandler);
    
    chipBase.checked = true;
    chipSlot2.disabled = false;
    chipSlot3.disabled = true;
    chipSlot4.disabled = true;
    
    updateVehicleBoard();
}

document.addEventListener('DOMContentLoaded', () => {
    if (!itemsData || itemsData.length === 0) {
        console.error('Нет данных для отображения');
        return;
    }
    
    initBoard();
    initVehicleGenerator();
    
    setTimeout(() => {
        if (typeof initBoard === 'function') {
            syncBoardThemeWithPageTheme();
        }
        if (typeof initVehicleGenerator === 'function') {
            syncVehicleBoardThemeWithPageTheme();
        }
    }, 100);
});
