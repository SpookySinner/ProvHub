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
