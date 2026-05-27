let galleryData = {};

document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/gallery')
    .then((res) => res.json())
    .then((data) => {
      galleryData = data;
      filterGallery('all'); // Boshida hamma rasmlarni ko'rsatish
    })
    .catch((err) => {
      document.getElementById('galleryContainer').innerHTML =
        '<p style="text-align:center; grid-column:1/-1;">Ошибка загрузки данных.</p>';
    });
});

function filterGallery(category) {
  const container = document.getElementById('galleryContainer');
  container.innerHTML = ''; // Tozalash

  // Aktiv tugma stilini o'zgartirish
  const buttons = document.querySelectorAll('.btn-filter');
  buttons.forEach((btn) => btn.classList.remove('active'));
  event.target.classList?.add('active');

  let itemsToRender = [];

  if (category === 'all') {
    // Hammasini bitta ro'yxatga yig'ish
    Object.keys(galleryData).forEach((cat) => {
      galleryData[cat].forEach((item) => itemsToRender.push(item));
    });
  } else {
    itemsToRender = galleryData[category] || [];
  }

  if (itemsToRender.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #7f8c8d; grid-column: 1/-1; padding: 40px;">В этом разделе пока нет фото или видео.</p>';
    return;
  }

  // Saralangan fayllarni ekranga chiqarish (Rasm va Video aralash)
  itemsToRender.forEach((item) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'gallery-item';

    if (item.type === 'video') {
      itemDiv.innerHTML = `
                <video controls>
                    <source src="${item.src}" type="video/mp4">
                </video>
                <div class="gallery-desc">🎬 Видео процесс работы</div>`;
    } else {
      itemDiv.innerHTML = `
                <img src="${item.src}" alt="Работа" onclick="openLightbox('${item.src}')">
                <div class="gallery-desc">📸 Фото выполненной работы</div>`;
    }
    container.appendChild(itemDiv);
  });
}

function openLightbox(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxModal').style.display = 'flex';
}

function closeLightbox() {
  document.getElementById('lightboxModal').style.display = 'none';
}

document
  .getElementById('lightboxModal')
  .addEventListener('click', function (e) {
    if (e.target !== document.getElementById('lightboxImg')) closeLightbox();
  });
