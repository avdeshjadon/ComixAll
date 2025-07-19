// main.js

// DOM Ready Handler

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname.split("/").pop();
  if (path === "index.html" || path === "") initHomePage();
  else if (path === "comic.html") initComicPage();
  else if (path === "reader.html") initReaderPage();
});

// ------------------ Home Page ------------------

function initHomePage() {
  loadComics();
  document.getElementById("search-btn").addEventListener("click", searchComics);
  document.getElementById("search-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchComics();
  });
}

async function loadComics() {
  const comicsGrid = document.getElementById("comics-grid");
  comicsGrid.innerHTML = "<div class='loading'>Loading comics...</div>";
  try {
    const snapshot = await firebase.firestore().collection("comics").orderBy("createdAt", "desc").get();
    comicsGrid.innerHTML = "";
    if (snapshot.empty) {
      comicsGrid.innerHTML = "<div class='loading'>No comics found.</div>";
      return;
    }
    snapshot.forEach(doc => createComicCard(doc.data(), doc.id));
  } catch (err) {
    comicsGrid.innerHTML = `<div class='loading error'>${err.message}</div>`;
  }
}

function createComicCard(comic, id) {
  const comicsGrid = document.getElementById("comics-grid");
  const card = document.createElement("div");
  card.className = "comic-card";
  card.innerHTML = `
    <img src="${comic.thumbnailUrl}" alt="${comic.title}" class="comic-thumbnail">
    <div class="comic-info">
      <h3 class="comic-title">${comic.title}</h3>
      <p class="comic-description">${comic.description || 'No description available'}</p>
    </div>`;
  card.addEventListener("click", () => window.location.href = `comic.html?id=${id}`);
  comicsGrid.appendChild(card);
}

function searchComics() {
  const term = document.getElementById("search-input").value.toLowerCase();
  const cards = document.querySelectorAll(".comic-card");
  let hasResult = false;
  cards.forEach(card => {
    const title = card.querySelector(".comic-title").textContent.toLowerCase();
    const desc = card.querySelector(".comic-description").textContent.toLowerCase();
    if (title.includes(term) || desc.includes(term)) {
      card.style.display = "block";
      hasResult = true;
    } else {
      card.style.display = "none";
    }
  });
  if (!hasResult) {
    document.getElementById("comics-grid").innerHTML += `<div class='loading no-results'>No comics match your search.</div>`;
  }
}

// ------------------ Comic Detail Page ------------------

function initComicPage() {
  loadComicDetails();
}

async function loadComicDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const comicId = urlParams.get("id");
  if (!comicId) return window.location.href = "index.html";

  try {
    const doc = await firebase.firestore().collection("comics").doc(comicId).get();
    if (!doc.exists) throw new Error("Comic not found");
    const comic = doc.data();

    document.getElementById("comic-title").textContent = comic.title;
    document.getElementById("comic-detail-thumbnail").src = comic.thumbnailUrl;

    const tagsContainer = document.getElementById("tags-container");
    if (tagsContainer && comic.tags?.length) {
      tagsContainer.innerHTML = '';
      comic.tags.forEach(tag => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = tag;
        tagsContainer.appendChild(span);
      });
    }

    // 🔥 Get images using proxy API
    const partsGrid = document.getElementById("parts-grid");
    partsGrid.innerHTML = '<div class="loading">Loading parts...</div>';

    const folderName = comic.title.replace(/\s+/g, '_');
    const response = await fetch(`/list-images?folder=${folderName}`);
    const data = await response.json();

    const partsMap = {};
    data.resources.forEach(file => {
      const match = file.public_id.match(/part_(\d+)/);
      if (match) {
        const part = `part_${match[1]}`;
        if (!partsMap[part]) partsMap[part] = [];
        partsMap[part].push(file);
      }
    });

    partsGrid.innerHTML = '';
    Object.entries(partsMap).sort((a, b) => parseInt(a[0].split('_')[1]) - parseInt(b[0].split('_')[1]))
      .forEach(([part, files]) => {
        files.sort((a, b) => a.public_id.localeCompare(b.public_id));
        const thumbnail = `https://res.cloudinary.com/dsoqtemux/image/upload/${files[0].public_id}.jpg`;
        const card = document.createElement("div");
        card.className = "part-card";
        card.innerHTML = `
          <img src="${thumbnail}" class="part-thumbnail" alt="${part}">
          <p class="part-title">${part.replace('_', ' ').toUpperCase()}</p>
        `;
        card.addEventListener("click", () => {
          window.location.href = `reader.html?comic=${folderName}&part=${part}`;
        });
        partsGrid.appendChild(card);
      });

  } catch (err) {
    document.querySelector("main").innerHTML = `
      <div class="loading error">
        <h2>Error loading comic</h2>
        <p>${err.message}</p>
        <a href="index.html" class="back-btn">← Back to Comics</a>
      </div>
    `;
  }
}

// ------------------ Reader Page ------------------

function initReaderPage() {
  loadComicReader();
}

async function loadComicReader() {
  const urlParams = new URLSearchParams(window.location.search);
  const folderName = urlParams.get('comic');
  const partName = urlParams.get('part');

  if (!folderName || !partName) return window.location.href = 'index.html';

  const reader = document.getElementById("comic-reader");
  const controls = document.querySelector(".reader-controls");
  document.getElementById("back-to-comic").href = `comic.html?id=${folderName}`;

  try {
    reader.innerHTML = '<div class="loading">Loading pages...</div>';
    const response = await fetch(`/list-images?folder=${folderName}`);
    const data = await response.json();
    const images = data.resources.filter(img => img.public_id.includes(partName))
                                 .sort((a, b) => a.public_id.localeCompare(b.public_id));

    reader.innerHTML = '';
    images.forEach(img => {
      const page = document.createElement("img");
      page.src = `https://res.cloudinary.com/dsoqtemux/image/upload/${img.public_id}.jpg`;
      page.className = "comic-page";
      page.loading = "lazy";
      reader.appendChild(page);
    });

    controls.classList.remove("hidden");
  } catch (err) {
    reader.innerHTML = `<div class="loading error"><h2>Error</h2><p>${err.message}</p></div>`;
    controls.classList.add("hidden");
  }
}
