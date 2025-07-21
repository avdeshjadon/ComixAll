const firebaseConfig = {
  apiKey: "AIzaSyCwkRk12HxQlQS2DH12lcolRNvF2ALprZM",
  authDomain: "comix-9be69.firebaseapp.com",
  projectId: "comix-9be69",
  storageBucket: "comix-9be69.appspot.com",
  messagingSenderId: "346083786632",
  appId: "1:346083786632:web:f95c8c3dacafe47f23843d",
};
const CLOUD_NAME = "comixall";

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const appView = document.getElementById("app-view");
const comicDetailView = document.getElementById("comic-detail-view");
const comicReaderView = document.getElementById("comic-reader-view");
const comicsGrid = document.getElementById("comics-grid");
const comicDetailContent = document.getElementById("comic-detail-content");
const comicPagesContainer = document.getElementById("comic-pages-container");
const comicDetailTemplate = document.getElementById("comic-detail-template");
const searchInput = document.getElementById("search-input");
const categoriesListContainer = document.getElementById(
  "categories-list-container"
);
const paginationContainer = document.getElementById("pagination-container");
const searchInputDetail = document.getElementById("search-input-detail");
const logoMainDetail = document.getElementById("logo-main-detail");
const prevPartBtnTop = document.getElementById("prev-part-btn-top");
const nextPartBtnTop = document.getElementById("next-part-btn-top");
const prevPartBtnBottom = document.getElementById("prev-part-btn-bottom");
const nextPartBtnBottom = document.getElementById("next-part-btn-bottom");
const backToDetailBtn = document.getElementById("back-to-detail-btn");
const scrollToTopBtn = document.getElementById("scroll-to-top-btn");
const progressIndicator = document.getElementById("progress-indicator");
const resultsHeadingContainer = document.getElementById(
  "results-heading-container"
);
const resultsHeadingText = document.getElementById("results-heading-text");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeToggleBtnDetail = document.getElementById("theme-toggle-btn-detail");
const avatarModal = document.getElementById("avatar-modal");
const avatarGrid = document.getElementById("avatar-selection-grid");

let allComics = [];
let currentComic = null;
let currentPage = 1;
let currentPartNumber = 1;
let totalParts = 0;
const comicsPerPage = 12;
let manifestCache = new Map();
let allPartsForCurrentComic = [];
let activeFilter = { type: "category", value: "all" };
let previousComicForTagFilter = null;
let tempSelectedAvatarUrl = null;

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
function generateFakeRating(comicId) {
  let hash = 0;
  if (!comicId || comicId.length === 0) {
    return 4.0;
  }
  for (let i = 0; i < comicId.length; i++) {
    const char = comicId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const rating = 3.5 + (Math.abs(hash) % 16) / 10;
  return parseFloat(rating.toFixed(1));
}
function renderStars(rating) {
  let starsHtml = "";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < fullStars; i++)
    starsHtml += '<i class="fas fa-star"></i>';
  if (hasHalfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
  for (let i = 0; i < emptyStars; i++)
    starsHtml += '<i class="far fa-star"></i>';
  return `${starsHtml} <span style="font-size: 0.8em; color: var(--text-secondary); vertical-align: middle; margin-left: 0.5em;">${rating}</span>`;
}
function filterComicsByTag(tag) {
  const filtered = allComics.filter(
    (comic) =>
      comic.tags && Array.isArray(comic.tags) && comic.tags.includes(tag)
  );
  activeFilter = { type: "tag", value: tag };
  showGridView();
  updateActiveFilters();
  renderComicsGrid(filtered);
}
function showGridView() {
  appView.style.display = "block";
  comicDetailView.style.display = "none";
  comicReaderView.style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
  removeKeyboardListeners();
}
function showDetailView(comic) {
  currentComic = comic;
  appView.style.display = "none";
  comicDetailView.style.display = "block";
  comicReaderView.style.display = "none";
  renderComicDetail(comic);
  window.scrollTo({ top: 0, behavior: "smooth" });
  removeKeyboardListeners();
}
function showReaderView(comic, part) {
  currentComic = comic;
  currentPartNumber = part.number;
  appView.style.display = "none";
  comicDetailView.style.display = "none";
  comicReaderView.style.display = "block";
  renderComicReader(comic, part);
  window.scrollTo({ top: 0, behavior: "smooth" });
  addKeyboardListeners();
  preloadNextPart(comic, part.number);
}
function renderLoadingState(container, text) {
  container.innerHTML = `<div class="loading"><div class="loading-spinner"></div><div class="loading-text">${text}</div></div>`;
}
function renderEmptyState(container, text) {
  container.innerHTML = `<div class="empty-state"><i class="fas fa-search empty-icon"></i><div class="empty-text">${text}</div></div>`;
}
function renderErrorState(container, text) {
  container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle empty-icon"></i><div class="empty-text" style="color: var(--error);">${text}</div></div>`;
}
function renderPagination(comicsToRender) {
  const totalPages = Math.ceil(comicsToRender.length / comicsPerPage);
  paginationContainer.innerHTML = "";
  if (totalPages <= 1) return;
  const prevButton = document.createElement("button");
  prevButton.className = "pagination-btn";
  prevButton.textContent = "Previous";
  prevButton.dataset.tooltip = "Previous Page";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderComicsGrid(comicsToRender);
    }
  });
  const nextButton = document.createElement("button");
  nextButton.className = "pagination-btn";
  nextButton.textContent = "Next";
  nextButton.dataset.tooltip = "Next Page";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderComicsGrid(comicsToRender);
    }
  });
  const pageInfo = document.createElement("span");
  pageInfo.className = "pagination-info";
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  paginationContainer.appendChild(prevButton);
  paginationContainer.appendChild(pageInfo);
  paginationContainer.appendChild(nextButton);
}
async function loadComics() {
  renderLoadingState(comicsGrid, "Loading comics...");
  try {
    const snapshot = await db
      .collection("comics")
      .orderBy("createdAt", "desc")
      .get();
    if (snapshot.empty) {
      renderEmptyState(comicsGrid, "No comics found.");
      return;
    }
    allComics = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderComicsGrid(allComics);
  } catch (err) {
    renderErrorState(comicsGrid, "Failed to load comics.");
    console.error(err);
  }
}
function renderComicsGrid(comicsToRender) {
  comicsGrid.innerHTML = "";
  if (comicsToRender.length === 0) {
    renderEmptyState(comicsGrid, "No comics match your filter.");
    paginationContainer.innerHTML = "";
    return;
  }
  const startIndex = (currentPage - 1) * comicsPerPage;
  const endIndex = startIndex + comicsPerPage;
  const paginatedComics = comicsToRender.slice(startIndex, endIndex);
  const fragment = document.createDocumentFragment();
  paginatedComics.forEach((comic, index) => {
    const card = document.createElement("div");
    card.className = "comic-card";
    card.style.animationDelay = `${index * 0.05}s`;
    card.innerHTML = `<div class="comic-thumbnail-container"><img src="${
      comic.thumbnailUrl
    }" alt="${
      comic.title
    }" class="comic-thumbnail" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x600/2a2a2a/ffffff?text=No+Image'"></div><div class="comic-info"><h3 class="comic-title">${
      comic.title
    }</h3><p class="comic-description">${(comic.description || "").substring(
      0,
      60
    )}...</p></div>`;
    card.addEventListener("click", () => showDetailView(comic));
    fragment.appendChild(card);
  });
  comicsGrid.appendChild(fragment);
  renderPagination(comicsToRender);
}
async function loadAndRenderCategories() {
  categoriesListContainer.innerHTML = `<li class="category-item"><a href="#" class="category-link">Loading...</a></li>`;
  try {
    const snapshot = await db.collection("categories").orderBy("name").get();
    let categoriesHtml = `<li class="category-item"><a href="#" class="category-link active" data-category-value="all" data-tooltip="All Comics">All</a></li><li class="category-item"><a href="#" class="category-link" data-category-value="trending" data-tooltip="Trending Comics">Trending</a></li><li class="category-item"><a href="#" class="category-link" data-category-value="most-viewed" data-tooltip="Most Viewed Comics">Most Viewed</a></li>`;
    snapshot.forEach((doc) => {
      const cat = doc.data();
      categoriesHtml += `<li class="category-item"><a href="#" class="category-link" data-category-value="${cat.value}" data-tooltip="${cat.name}">${cat.name}</a></li>`;
    });
    categoriesListContainer.innerHTML = categoriesHtml;
    addCategoryLinkListeners();
  } catch (err) {
    categoriesListContainer.innerHTML = `<li class="category-item"><a href="#" class="category-link">Error</a></li>`;
    console.error("Failed to load categories:", err);
  }
}
function updateActiveFilters() {
  const backBtn = document.getElementById("back-from-tag-btn");
  const categoryLinks =
    categoriesListContainer.querySelectorAll(".category-link");
  categoryLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      activeFilter.type === "category" &&
        link.dataset.categoryValue === activeFilter.value
    );
  });
  backBtn.style.display =
    previousComicForTagFilter && activeFilter.type === "tag"
      ? "inline-flex"
      : "none";
  if (
    (activeFilter.type === "category" && activeFilter.value === "all") ||
    (activeFilter.type === "search" && !activeFilter.value)
  ) {
    resultsHeadingContainer.style.display = "none";
  } else {
    resultsHeadingContainer.style.display = "block";
    let valueText = activeFilter.value;
    if (activeFilter.type === "category") {
      const activeLink = document.querySelector(
        `.category-link[data-category-value="${valueText}"]`
      );
      if (activeLink) valueText = activeLink.textContent;
      resultsHeadingText.innerHTML = `<span class="filter-value">${valueText}</span>`;
    } else if (activeFilter.type === "tag") {
      resultsHeadingText.innerHTML = `<span class="filter-value">${valueText}</span>`;
    } else {
      let typeText =
        activeFilter.type.charAt(0).toUpperCase() + activeFilter.type.slice(1);
      resultsHeadingText.innerHTML = `<span class="filter-type">${typeText}:</span> <span class="filter-value">"${valueText}"</span>`;
    }
  }
}
function addCategoryLinkListeners() {
  const dynamicCategoryLinks =
    categoriesListContainer.querySelectorAll(".category-link");
  dynamicCategoryLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = 1;
      previousComicForTagFilter = null;
      const categoryValue = link.dataset.categoryValue;
      activeFilter = { type: "category", value: categoryValue };
      updateActiveFilters();
      let filteredComics = allComics;
      if (categoryValue === "trending") {
        filteredComics = [...allComics].sort(
          (a, b) => (b.recentViews || 0) - (a.recentViews || 0)
        );
      } else if (categoryValue === "most-viewed") {
        filteredComics = [...allComics].sort(
          (a, b) => (b.totalViews || 0) - (a.totalViews || 0)
        );
      } else if (categoryValue !== "all") {
        filteredComics = allComics.filter(
          (comic) => comic.category === categoryValue
        );
      }
      renderComicsGrid(filteredComics);
    });
  });
}
async function renderComicDetail(comic) {
  comicDetailContent.innerHTML = "";
  const detailClone = comicDetailTemplate.content.cloneNode(true);
  detailClone.getElementById("detail-thumbnail").src = comic.thumbnailUrl;
  detailClone.getElementById("detail-thumbnail").alt = comic.title;
  detailClone.getElementById("detail-title").textContent = comic.title;
  detailClone.getElementById("detail-author").innerHTML = comic.author
    ? `<strong>Author:</strong> ${comic.author}`
    : "<strong>Author:</strong> N/A";
  const descriptionElement = detailClone.getElementById("detail-description");
  descriptionElement.textContent =
    comic.description || "No description available.";
  const ratingValue = generateFakeRating(comic.id);
  detailClone.getElementById("detail-rating").innerHTML =
    renderStars(ratingValue);
  detailClone.getElementById(
    "detail-category"
  ).innerHTML = `<strong>Category:</strong> ${comic.category || "N/A"}`;
  const publishDate = comic.createdAt?.toDate
    ? comic.createdAt.toDate().toLocaleDateString()
    : "N/A";
  detailClone.getElementById(
    "detail-publish-date"
  ).innerHTML = `<strong>Published:</strong> ${publishDate}`;
  const status = comic.title.length % 2 === 0 ? "Completed" : "Ongoing";
  detailClone.getElementById(
    "detail-status"
  ).innerHTML = `<strong>Status:</strong> ${status}`;
  const tagsContainer = detailClone.getElementById("detail-tags-container");
  const tagsLabel = tagsContainer.querySelector("span");
  tagsContainer.innerHTML = "";
  tagsContainer.appendChild(tagsLabel);
  if (comic.tags && comic.tags.length > 0) {
    comic.tags.forEach((tag) => {
      const tagElement = document.createElement("a");
      tagElement.href = "#";
      tagElement.className = "tag-link";
      tagElement.textContent = tag;
      if (activeFilter.type === "tag" && activeFilter.value === tag) {
        tagElement.classList.add("active");
      }
      tagElement.onclick = (e) => {
        e.preventDefault();
        previousComicForTagFilter = currentComic;
        filterComicsByTag(tag);
      };
      tagsContainer.appendChild(tagElement);
    });
  } else {
    tagsContainer.style.display = "none";
  }
  const showMoreBtn = detailClone.querySelector(".show-more-btn");
  comicDetailContent.appendChild(detailClone);
  setTimeout(() => {
    if (descriptionElement.scrollHeight > descriptionElement.clientHeight) {
      descriptionElement.classList.add("truncated");
      showMoreBtn.style.display = "inline-block";
      showMoreBtn.textContent = "Show More";
      showMoreBtn.addEventListener("click", () => {
        descriptionElement.classList.toggle("truncated");
        showMoreBtn.textContent = descriptionElement.classList.contains(
          "truncated"
        )
          ? "Show More"
          : "Show Less";
      });
    }
  }, 100);
  loadAndDisplayPartsAndViews(comic);
  renderSuggestions(
    comicDetailContent.querySelector("#suggestions-grid"),
    comic
  );
}
async function loadAndDisplayPartsAndViews(comic) {
  const partsContainer = comicDetailContent.querySelector(
    "#parts-list-container"
  );
  const totalViewsContainer =
    comicDetailContent.querySelector("#detail-views span");
  totalViewsContainer.textContent = comic.totalViews || "0";
  if (!comic.manifestUrl) {
    renderEmptyState(
      partsContainer,
      "This comic does not have any parts listed."
    );
    return;
  }
  renderLoadingState(partsContainer, "Loading comic parts...");
  try {
    let manifest = manifestCache.get(comic.manifestUrl);
    if (!manifest) {
      const response = await fetch(comic.manifestUrl);
      if (!response.ok) throw new Error("Manifest file not found");
      manifest = await response.json();
      manifestCache.set(comic.manifestUrl, manifest);
    }
    const partsFromManifest = manifest.parts || [];
    if (partsFromManifest.length === 0) {
      renderEmptyState(partsContainer, "No parts found in the manifest file.");
      return;
    }
    totalParts = partsFromManifest.length;
    const [overridesSnapshot, viewsSnapshot] = await Promise.all([
      db.collection("comics").doc(comic.id).collection("part_overrides").get(),
      db.collection("comics").doc(comic.id).collection("part_views").get(),
    ]);
    const overridesMap = new Map(
      overridesSnapshot.docs.map((doc) => [doc.id, doc.data().title])
    );
    const viewsMap = new Map(
      viewsSnapshot.docs.map((doc) => [doc.id, doc.data().views || 0])
    );
    allPartsForCurrentComic = partsFromManifest.map((part) => {
      const partNumStr = String(part.number);
      const title =
        overridesMap.get(partNumStr) || `${comic.title} - Part ${part.number}`;
      const views = viewsMap.get(partNumStr) || 0;
      return { ...part, title, views };
    });
    renderPartsList(partsContainer, allPartsForCurrentComic, comic);
  } catch (error) {
    renderErrorState(partsContainer, "Could not load comic parts info.");
    console.error(error);
  }
}
function renderPartsList(container, parts, comic) {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  parts.forEach((part, index) => {
    const partItem = document.createElement("div");
    partItem.className = "part-item";
    partItem.style.animationDelay = `${index * 0.05}s`;
    const uploadDate = comic.createdAt?.toDate
      ? new Date(comic.createdAt.toDate().getTime()).toLocaleDateString()
      : "Unknown";
    partItem.innerHTML = `<div class="part-content"><div>${
      part.title
    }</div><div style="font-size: 0.8rem; color: var(--text-secondary);">${
      part.pages
    } pages</div><div class="part-meta">Uploaded: ${uploadDate}</div></div><div class="part-views"><i class="fas fa-eye"></i> ${
      part.views || 0
    }</div>`;
    partItem.addEventListener("click", async () => {
      await updateViewCount(comic.id, part.number);
      showReaderView(comic, part);
    });
    fragment.appendChild(partItem);
  });
  container.appendChild(fragment);
}
async function updateViewCount(comicId, partNumber) {
  if (!auth.currentUser) return;
  try {
    const comicRef = db.collection("comics").doc(comicId);
    const partRef = comicRef.collection("part_views").doc(String(partNumber));
    await db.runTransaction(async (transaction) => {
      const partDoc = await transaction.get(partRef);
      if (!partDoc.exists) {
        transaction.set(partRef, { views: 1 });
      } else {
        transaction.update(partRef, {
          views: firebase.firestore.FieldValue.increment(1),
        });
      }
      transaction.update(comicRef, {
        totalViews: firebase.firestore.FieldValue.increment(1),
      });
    });
  } catch (err) {
    console.error(`Failed to update views for part ${partNumber}:`, err);
  }
}
function renderSuggestions(container, currentComic) {
  let maxSuggestions =
    window.innerWidth <= 992 ? (window.innerWidth <= 576 ? 30 : 40) : 50;
  const categorySuggestions = allComics
    .filter(
      (c) => c.id !== currentComic.id && c.category === currentComic.category
    )
    .sort(() => 0.5 - Math.random())
    .slice(0, 20);
  let finalSuggestions = [...categorySuggestions];
  const suggestedIds = new Set(finalSuggestions.map((c) => c.id));
  suggestedIds.add(currentComic.id);
  if (finalSuggestions.length < maxSuggestions) {
    const currentTags = new Set(currentComic.tags || []);
    if (currentTags.size > 0) {
      const potentialTagSuggestions = allComics
        .filter((c) => !suggestedIds.has(c.id))
        .map((c) => ({
          comic: c,
          score: [...new Set(c.tags || [])].filter((tag) =>
            currentTags.has(tag)
          ).length,
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
      const remainingSlots = maxSuggestions - finalSuggestions.length;
      finalSuggestions.push(
        ...potentialTagSuggestions
          .slice(0, remainingSlots)
          .map((item) => item.comic)
      );
    }
  }
  container.innerHTML = "";
  const suggestionsToRender = finalSuggestions.slice(0, maxSuggestions);
  if (suggestionsToRender.length === 0) {
    renderEmptyState(container, "No similar comics found.");
    return;
  }
  const fragment = document.createDocumentFragment();
  suggestionsToRender.forEach((comic, index) => {
    const card = document.createElement("div");
    card.className = "comic-card";
    card.style.animationDelay = `${index * 0.05}s`;
    card.innerHTML = `<div class="comic-thumbnail-container"><img src="${comic.thumbnailUrl}" alt="${comic.title}" class="comic-thumbnail" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x600/2a2a2a/ffffff?text=No+Image'"></div><div class="comic-info"><h3 class="comic-title">${comic.title}</h3></div>`;
    card.addEventListener("click", () => showDetailView(comic));
    fragment.appendChild(card);
  });
  container.appendChild(fragment);
}
async function renderComicReader(comic, part) {
  document.getElementById("reader-title").textContent = part.title;
  progressIndicator.textContent = `Part ${part.number} of ${totalParts}`;
  comicPagesContainer.innerHTML = "";
  if (!part.pages || part.pages < 1) {
    renderEmptyState(comicPagesContainer, "No pages found for this part.");
    return;
  }
  const fragment = document.createDocumentFragment();
  for (let i = 1; i <= part.pages; i++) {
    const pageNumFormatted = String(i).padStart(3, "0");
    const imageName = `part${part.number}_image_${pageNumFormatted}`;
    const imageUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_100,f_jpg/${comic.folderName}/${imageName}.jpg`;
    const img = document.createElement("img");
    img.src = imageUrl;
    img.className = "comic-page-img";
    img.loading = "lazy";
    img.alt = `Page ${i} of ${part.title}`;
    img.style.animationDelay = `${i * 0.05}s`;
    img.onerror = function () {
      this.onerror = null;
      this.src =
        "https://via.placeholder.com/1200x1800/2a2a2a/ffffff?text=Page+Not+Found";
    };
    fragment.appendChild(img);
  }
  comicPagesContainer.appendChild(fragment);
  prevPartBtnTop.disabled = part.number === 1;
  nextPartBtnTop.disabled = part.number === totalParts;
  prevPartBtnBottom.disabled = part.number === 1;
  nextPartBtnBottom.disabled = part.number === totalParts;
  scrollToTopBtn.classList.remove("visible");
  window.onscroll = () => {
    requestAnimationFrame(() => {
      scrollToTopBtn.classList.toggle("visible", window.scrollY > 300);
    });
  };
}
async function navigateToPart(comic, newPartNumber) {
  const partToNavigate = allPartsForCurrentComic.find(
    (p) => p.number === newPartNumber
  );
  if (partToNavigate) {
    await updateViewCount(comic.id, newPartNumber);
    showReaderView(comic, partToNavigate);
  }
}
async function preloadNextPart(comic, currentPartNumber) {
  if (currentPartNumber >= totalParts) return;
  try {
    let manifest = manifestCache.get(comic.manifestUrl);
    if (!manifest) {
      const response = await fetch(comic.manifestUrl);
      if (!response.ok) return;
      manifest = await response.json();
      manifestCache.set(comic.manifestUrl, manifest);
    }
    const nextPart = manifest.parts.find(
      (p) => p.number === currentPartNumber + 1
    );
    if (!nextPart) return;
    for (let i = 1; i <= nextPart.pages; i++) {
      const pageNumFormatted = String(i).padStart(3, "0");
      const imageName = `part${nextPart.number}_image_${pageNumFormatted}`;
      const imageUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_100,f_jpg/${comic.folderName}/${imageName}.jpg`;
      const img = new Image();
      img.src = imageUrl;
    }
  } catch (error) {
    console.warn(
      `Failed to preload next part ${currentPartNumber + 1}:`,
      error
    );
  }
}
const handleSearch = debounce(() => {
  const query =
    searchInput.value.trim().toLowerCase() ||
    searchInputDetail.value.trim().toLowerCase();
  currentPage = 1;
  previousComicForTagFilter = null;
  activeFilter = { type: "search", value: query };
  updateActiveFilters();
  const filteredComics = allComics.filter(
    (comic) =>
      comic.title.toLowerCase().includes(query) ||
      (comic.description || "").toLowerCase().includes(query) ||
      (comic.author || "").toLowerCase().includes(query) ||
      (comic.tags || []).some((tag) => tag.toLowerCase().includes(query))
  );
  renderComicsGrid(filteredComics);
}, 300);
function resetToHomeView() {
  showGridView();
  currentPage = 1;
  previousComicForTagFilter = null;
  activeFilter = { type: "category", value: "all" };
  updateActiveFilters();
  renderComicsGrid(allComics);
}
async function handleSubscribeForm(e, formId) {
  e.preventDefault();
  const form = document.getElementById(formId);
  const emailInput = form.querySelector(".newsletter-input");
  const statusMessage = form.querySelector(".form-status-message");
  const email = emailInput.value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    statusMessage.textContent = "Please enter a valid email address.";
    statusMessage.className = "form-status-message error";
    statusMessage.style.opacity = "1";
    setTimeout(() => {
      statusMessage.style.opacity = "0";
      setTimeout(() => (statusMessage.textContent = ""), 300);
    }, 3000);
    return;
  }
  try {
    await db
      .collection("newsletter_subscribers")
      .add({
        email,
        subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    statusMessage.textContent = "Thank you for subscribing!";
    statusMessage.className = "form-status-message success";
    statusMessage.style.opacity = "1";
    emailInput.value = "";
    setTimeout(() => {
      statusMessage.style.opacity = "0";
      setTimeout(() => (statusMessage.textContent = ""), 300);
    }, 3000);
  } catch (err) {
    statusMessage.textContent = "Failed to subscribe. Try again later.";
    statusMessage.className = "form-status-message error";
    statusMessage.style.opacity = "1";
    console.error("Subscription error:", err);
    setTimeout(() => {
      statusMessage.style.opacity = "0";
      setTimeout(() => (statusMessage.textContent = ""), 300);
    }, 3000);
  }
}
function addKeyboardListeners() {
  document.addEventListener("keydown", handleKeyboardNavigation);
}
function removeKeyboardListeners() {
  document.removeEventListener("keydown", handleKeyboardNavigation);
}
function handleKeyboardNavigation(e) {
  if (comicReaderView.style.display !== "block") return;
  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      prevPartBtnTop.click();
      break;
    case "ArrowRight":
      e.preventDefault();
      nextPartBtnTop.click();
      break;
    case "Escape":
      e.preventDefault();
      backToDetailBtn.click();
      break;
    case "Home":
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      break;
    case "End":
      e.preventDefault();
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      break;
  }
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const iconClass = theme === "light" ? "fa-moon" : "fa-sun";
  const iconHtml = `<i class="fas ${iconClass}"></i>`;
  themeToggleBtn.innerHTML = iconHtml;
  themeToggleBtnDetail.innerHTML = iconHtml;
  themeToggleBtn.classList.toggle("toggled", theme === "light");
  themeToggleBtnDetail.classList.toggle("toggled", theme === "light");
}

const presetAvatars = Array.from(
  { length: 10 },
  (_, i) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=${i + 1}&size=40`
);

function updateAuthUI(user, userData) {
  const authContainers = document.querySelectorAll(".auth-container");
  let authHTML;
  if (user && userData) {
    authHTML = `
            <button class="logout-icon-btn" title="Logout" data-tooltip="Logout">
                <i class="fas fa-sign-out-alt"></i>
            </button>
            <img src="${userData.avatarUrl}" alt="${userData.displayName}" class="profile-avatar" title="Change Avatar">
        `;
  } else {
    authHTML = `<a href="login.html" class="auth-btn">Login</a>`;
  }
  authContainers.forEach((container) => {
    container.innerHTML = authHTML;
    if (user && userData) {
      container
        .querySelector(".logout-icon-btn")
        .addEventListener("click", logout);
      container
        .querySelector(".profile-avatar")
        .addEventListener("click", () => showAvatarModal(userData.avatarUrl));
    }
  });
}

function logout() {
  auth.signOut();
}

function showAvatarModal(currentAvatarUrl) {
  tempSelectedAvatarUrl = currentAvatarUrl;
  avatarGrid.innerHTML = "";
  presetAvatars.forEach((avatarSrc) => {
    const img = document.createElement("img");
    img.src = avatarSrc;
    img.className = "avatar-option";
    if (avatarSrc === tempSelectedAvatarUrl) {
      img.classList.add("selected");
    }
    img.onclick = () => {
      const currentlySelected = avatarGrid.querySelector(".selected");
      if (currentlySelected) currentlySelected.classList.remove("selected");
      img.classList.add("selected");
      tempSelectedAvatarUrl = avatarSrc;
    };
    avatarGrid.appendChild(img);
  });
  avatarModal.classList.add("visible");
}

function hideAvatarModal() {
  avatarModal.classList.remove("visible");
}

async function saveAvatarSelection() {
  const user = auth.currentUser;
  if (user && tempSelectedAvatarUrl) {
    const userRef = db.collection("users").doc(user.uid);
    try {
      await userRef.update({ avatarUrl: tempSelectedAvatarUrl });
      document
        .querySelectorAll(".profile-avatar")
        .forEach((img) => (img.src = tempSelectedAvatarUrl));
      hideAvatarModal();
    } catch (error) {
      console.error("Error saving avatar:", error);
      alert("Could not save avatar. Please try again.");
    }
  }
}

auth.onAuthStateChanged((user) => {
  if (user) {
    const userRef = db.collection("users").doc(user.uid);
    userRef.onSnapshot(
      (doc) => {
        if (doc.exists) {
          updateAuthUI(user, doc.data());
        } else {
          logout();
        }
      },
      (err) => {
        console.error("Error fetching user profile:", err);
        updateAuthUI(null, null);
      }
    );
  } else {
    updateAuthUI(null, null);
  }
});

function setupEventListeners() {
  document.getElementById("logo-main").addEventListener("click", (e) => {
    e.preventDefault();
    resetToHomeView();
  });
  logoMainDetail.addEventListener("click", (e) => {
    e.preventDefault();
    resetToHomeView();
  });
  searchInput.addEventListener("input", handleSearch);
  document
    .querySelectorAll(".search-btn")
    .forEach((btn) => btn.addEventListener("click", handleSearch));
  searchInputDetail.addEventListener("input", handleSearch);
  document
    .getElementById("back-from-tag-btn")
    .addEventListener("click", (e) => {
      e.preventDefault();
      if (previousComicForTagFilter) {
        showDetailView(previousComicForTagFilter);
        previousComicForTagFilter = null;
      }
    });
  prevPartBtnTop.addEventListener("click", () => {
    if (currentPartNumber > 1)
      navigateToPart(currentComic, currentPartNumber - 1);
  });
  nextPartBtnTop.addEventListener("click", () => {
    if (currentPartNumber < totalParts)
      navigateToPart(currentComic, currentPartNumber + 1);
  });
  prevPartBtnBottom.addEventListener("click", () => {
    if (currentPartNumber > 1)
      navigateToPart(currentComic, currentPartNumber - 1);
  });
  nextPartBtnBottom.addEventListener("click", () => {
    if (currentPartNumber < totalParts)
      navigateToPart(currentComic, currentPartNumber + 1);
  });
  backToDetailBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showDetailView(currentComic);
  });
  document.getElementById("back-to-grid-btn").addEventListener("click", (e) => {
    e.preventDefault();
    resetToHomeView();
  });
  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document
    .getElementById("newsletter-form-main")
    .addEventListener("submit", (e) =>
      handleSubscribeForm(e, "newsletter-form-main")
    );
  document
    .getElementById("newsletter-form-detail")
    .addEventListener("submit", (e) =>
      handleSubscribeForm(e, "newsletter-form-detail")
    );
  document
    .querySelector(".avatar-modal-close")
    .addEventListener("click", hideAvatarModal);
  document
    .getElementById("save-avatar-btn")
    .addEventListener("click", saveAvatarSelection);
  window.addEventListener("click", (event) => {
    if (event.target == avatarModal) hideAvatarModal();
  });
  [themeToggleBtn, themeToggleBtnDetail].forEach((btn) => {
    btn.addEventListener("click", () => {
      const currentTheme = localStorage.getItem("theme") || "dark";
      applyTheme(currentTheme === "dark" ? "light" : "dark");
    });
  });
}

async function init() {
  try {
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);
    setupEventListeners();
    await loadComics();
    await loadAndRenderCategories();
  } catch (err) {
    console.error("Initialization error:", err);
    renderErrorState(comicsGrid, "Failed to initialize the app.");
  }
}

init();
