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
    // Izohlarni yuklash funksiyasi
    function loadReviews() {
      fetch('/api/reviews')
        .then((res) => res.json())
        .then((reviews) => {
          const container = document.getElementById('reviewsContainer');
          container.innerHTML = ''; // Tozalash

          reviews.forEach((rev) => {
            const starsString =
              '★'.repeat(rev.stars) + '☆'.repeat(5 - rev.stars);
            container.innerHTML += `
                    <div class="review-card">
                        <p class="review-text">"${rev.text}"</p>
                        <div class="review-author">
                            <span>${rev.name}</span>
                            <span class="stars">${starsString}</span>
                        </div>
                    </div>`;
          });
        });
    }

    // Sayt ochilganda izohlarni ham yuklaymiz
    document.addEventListener('DOMContentLoaded', () => {
      loadReviews(); // Izohlarni yuklashni chaqirish
    });

    // Yangi izoh yuborish jaryoni
    function submitReview(event) {
      event.preventDefault();

      const name = document.getElementById('revName').value;
      const stars = document.getElementById('revStars').value;
      const text = document.getElementById('revText').value;

      fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text, stars }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert('Спасибо! Ваш отзыв успешно добавлен.');
            document.getElementById('addReviewForm').reset(); // Formani tozalash
            loadReviews(); // Izohlarni qayta yangilash
          } else {
            alert('Ошибка при добавлении отзыва.');
          }
        });
    }
  });
