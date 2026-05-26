// Sayt yuklanganda serverdan rasm va videolarni olib kelish
document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/gallery')
    .then((res) => res.json())
    .then((data) => {
      renderConcrete(data.beton);
      renderPortfolio(data);
    });
});

// Beton videolarini joylash
function renderConcrete(videos) {
  const concreteGrid = document.querySelector('.concrete-grid');
  concreteGrid.innerHTML = ''; // Tozalash
  videos.forEach((src) => {
    if (src.endsWith('.mp4')) {
      concreteGrid.innerHTML += `
                <div class="gallery-item">
                    <video controls>
                        <source src="${src}" type="video/mp4">
                    </video>
                    <div class="gallery-desc">Процесс работы (Бетон)</div>
                </div>`;
    }
  });
}

// Qolgan barcha rasmlarni umumiy galereyaga joylash (Gazon, Bruschatka, Remont)
function renderPortfolio(data) {
  const galleryGrid = document.querySelector('.gallery-grid');
  galleryGrid.innerHTML = ''; // Tozalash

  const allItems = [...data.gazon, ...data.bruschatka, ...data.remont];
  allItems.forEach((src) => {
    if (!src.endsWith('.mp4')) {
      // Faqat rasmlar uchun
      galleryGrid.innerHTML += `
                <div class="gallery-item" onclick="openLightbox(this)">
                    <img src="${src}" alt="Работа">
                </div>`;
    }
  });
}

// Lightbox funksiyalari (Eski holatda qoladi)
function openLightbox(element) {
  var imgSrc = element.querySelector('img').src;
  document.getElementById('lightboxImg').src = imgSrc;
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
