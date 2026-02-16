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
  if (!localStorage.getItem('boardTheme')) {
    syncBoardThemeWithPageTheme();
  }
});

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
function handleSystemThemeChange(e) {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light');
    if (!localStorage.getItem('boardTheme')) {
      syncBoardThemeWithPageTheme();
    }
  }
}
mediaQuery.addEventListener('change', handleSystemThemeChange);

if (typeof itemsDatabase === 'undefined') {
  console.error('Ошибка: База данных itemsDatabase не найдена!');
} else {
  console.log(`База данных загружена. Всего предметов: ${itemsDatabase.length}`);
}

const TOTAL_ITEMS_IN_GAME = 960+49+173+127;

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
  const uniqueTypes = [...new Set(types)];
  uniqueTypes.sort();
  return ['Все предметы', ...uniqueTypes];
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
    } else {
      itemCount = itemsData.filter(item => item.type === category).length;
    }

    button.innerHTML = `
      <span>${category}</span>
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

  if (currentCategory !== 'Все предметы') {
    filtered = filtered.filter(item => item.type === currentCategory);
  }

  if (currentEvent !== 'Все ивенты') {
    filtered = filtered.filter(item => item.event === currentEvent);
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

function filterAndRenderItems() {
  const filteredItems = getFilteredItems();
  renderItemsGrid(filteredItems);
  
  if (placeholderText) {
    let totalInFilters = itemsData.length;
    if (currentCategory !== 'Все предметы') {
      totalInFilters = itemsData.filter(i => i.type === currentCategory).length;
    }
    if (currentEvent !== 'Все ивенты') {
      const eventFiltered = itemsData.filter(i => i.event === currentEvent);
      totalInFilters = eventFiltered.length;
    }
    placeholderText.placeholder = `Поиск ${filteredItems.length} из ${totalInFilters} предметов...`;
  }
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
let dragStartX = 0, dragStartY = 0;
let dragStartLeft = 0, dragStartTop = 0;
let boardTheme = 'light';

const MAX_BOARD_ITEMS = 25;
const BOARD_CELL_SIZE = 128;
const BOARD_GAP = 16;
const BOARD_PADDING = 70;

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
      <div class="smaller text-secondary">#${item.id} · ${item.type}</div>
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
  exportBoard.style.padding = BOARD_PADDING + 'px';
  exportBoard.style.gap = BOARD_GAP + 'px';
  exportBoard.style.display = 'grid';
  exportBoard.style.gridTemplateColumns = 'repeat(5, 1fr)';
  exportBoard.style.gridTemplateRows = 'repeat(5, 1fr)';
  
  exportBoard.style.position = 'absolute';
  exportBoard.style.left = '-9999px';
  exportBoard.style.top = '-9999px';
  exportBoard.style.boxSizing = 'border-box';
  
  const availableWidth = boardWidth - (2 * BOARD_PADDING) - (4 * BOARD_GAP);
  const cardSize = Math.floor(availableWidth / 5);
  
  const loadImagePromises = [];
  
  for (const boardItem of boardItems) {
    const item = boardItem.item;
    const count = boardItem.count;
    
    const card = document.createElement('div');
    card.className = 'board-item';
    card.style.width = cardSize + 'px';
    card.style.height = cardSize + 'px';
    
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

document.addEventListener('DOMContentLoaded', () => {
  if (!itemsData || itemsData.length === 0) {
    console.error('Нет данных для отображения');
    return;
  }
  
  initBoard();
  setTimeout(() => {
    if (typeof initBoard === 'function') {
      syncBoardThemeWithPageTheme();
    }
  }, 100);
});
