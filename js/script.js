const firebaseConfig = {
  apiKey: "AIzaSyCwkRk12HxQlQS2DH12lcolRNvF2ALprZM", // Replace with your actual API key
  authDomain: "comix-9be69.firebaseapp.com",
  projectId: "comix-9be69",
  storageBucket: "comix-9be69.appspot.com",
  messagingSenderId: "346083786632",
  appId: "1:346083786632:web:f95c8c3dacafe47f23843d",
};
const CLOUD_NAME = "comixall";

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- DOM ELEMENTS ---
const authContainer = document.getElementById("auth-container");
const authContainerDetail = document.getElementById("auth-container-detail");
const loginModal = document.getElementById("login-modal");
const loginForm = document.getElementById("login-form");
const loginModalClose = document.getElementById("login-modal-close");
const avatarModal = document.getElementById("avatar-modal");
const avatarModalClose = document.getElementById("avatar-modal-close");
const avatarGrid = document.getElementById("avatar-grid");
const favoritesModal = document.getElementById("favorites-modal");
const favoritesModalClose = document.getElementById("favorites-modal-close");
const favoritesGrid = document.getElementById("favorites-grid");
const favoritesBtn = document.getElementById("favorites-btn");
const modalTitle = document.getElementById("modal-title");
const usernameGroup = document.getElementById("username-group");
const confirmPasswordGroup = document.getElementById("confirm-password-group");
const formSubmitBtn = document.getElementById("form-submit-btn");
const authToggleLink = document.getElementById("auth-toggle-link");
const loginStatus = document.getElementById("login-status");
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

// --- STATE VARIABLES ---
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
let currentUser = null; // State for the logged-in user

// --- AVATAR PRESETS (Using DiceBear for more variety) ---
const presetAvatars = [
  "adventurer",
  "pixel-art",
  "bottts",
  "micah",
  "fun-emoji",
  "initials",
  "lorelei",
  "shapes",
  "thumbs",
  "avataaars",
  "big-ears",
  "notionists",
].map(
  (style) =>
    `https://api.dicebear.com/8.x/${style}/svg?seed=${Math.random()
      .toString(36)
      .substring(7)}`
);

// =================================================================
// JAVASCRIPT FUNCTIONS
// =================================================================

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const handleSearch = debounce(() => {
  const query = (
    searchInput.value.trim() || searchInputDetail.value.trim()
  ).toLowerCase();
  currentPage = 1;
  previousComicForTagFilter = null;
  activeFilter = { type: "search", value: query };
  updateActiveFilters();
  renderComicsGrid(getFilteredComics());
}, 300);

// --- AUTHENTICATION & USER LOGIC (CUSTOM FLOW) ---
function updateAuthUI() {
  authContainer.innerHTML = "";
  authContainerDetail.innerHTML = "";

  let authHTML;
  if (currentUser) {
    authHTML = `
                    <div class="user-profile">
                        <button class="logout-btn" data-tooltip="Logout"><i class="fas fa-sign-out-alt"></i></button>
                        <img src="${currentUser.avatarUrl}" alt="User Avatar" class="user-avatar" data-tooltip="Change Avatar">
                    </div>
                `;
  } else {
    authHTML = `<button class="nav-btn login-btn">Login</button>`;
  }

  authContainer.innerHTML = authHTML;
  authContainerDetail.innerHTML = authHTML;

  if (currentUser) {
    document
      .querySelectorAll(".logout-btn")
      .forEach((btn) => btn.addEventListener("click", handleLogout));
    document
      .querySelectorAll(".user-avatar")
      .forEach((avatar) =>
        avatar.addEventListener("click", () =>
          avatarModal.classList.add("visible")
        )
      );
  } else {
    document.querySelectorAll(".login-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        loginModal.classList.add("visible");
        toggleAuthMode("login");
      });
    });
  }
}

function toggleAuthMode(mode) {
  if (mode === "signup") {
    loginForm.dataset.mode = "signup";
    modalTitle.textContent = "Sign Up";
    usernameGroup.style.display = "block";
    confirmPasswordGroup.style.display = "block";
    formSubmitBtn.textContent = "Sign Up";
    authToggleLink.innerHTML =
      'Already have an account? <a id="show-login-btn">Log In</a>';
    document.getElementById("show-login-btn").addEventListener("click", (e) => {
      e.preventDefault();
      toggleAuthMode("login");
    });
  } else {
    loginForm.dataset.mode = "login";
    modalTitle.textContent = "Login";
    usernameGroup.style.display = "none";
    confirmPasswordGroup.style.display = "none";
    formSubmitBtn.textContent = "Login";
    authToggleLink.innerHTML = `Don't have an account? <a id="show-signup-btn">Sign Up</a>`;
    document
      .getElementById("show-signup-btn")
      .addEventListener("click", (e) => {
        e.preventDefault();
        toggleAuthMode("signup");
      });
  }
  setStatusMessage("", "none");
  loginForm.reset();
}

function togglePasswordVisibility(e) {
  const button = e.currentTarget;
  const wrapper = button.parentElement;
  const input = wrapper.querySelector("input");
  const icon = button.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

async function handleAuthFormSubmit(e) {
  e.preventDefault();
  const mode = loginForm.dataset.mode;
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  const confirmPassword = loginForm["confirm-password"].value;
  const username = loginForm.username.value.trim();

  setStatusMessage("", "none");

  if (mode === "signup") {
    if (!username) return setStatusMessage("Please enter a username.", "error");
    if (password !== confirmPassword) {
      return setStatusMessage("Passwords do not match.", "error");
    }
    await handleSignUp(email, password, username);
  } else {
    await handleSignIn(email, password);
  }
}

async function handleSignUp(email, password, displayName) {
  try {
    // 1. Check if user already exists in 'clients' collection
    const existingUserQuery = await db
      .collection("clients")
      .where("email", "==", email)
      .get();
    if (!existingUserQuery.empty) {
      return setStatusMessage(
        "An account with this email already exists.",
        "error"
      );
    }

    // 2. Add new user to 'clients' collection
    const newUserRef = await db.collection("clients").add({
      displayName: displayName,
      email: email,
      password: password, // Storing password in plain text (NOT RECOMMENDED)
      avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${displayName}`,
      favorites: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Set current user and update UI
    const newUserDoc = await newUserRef.get();
    currentUser = { id: newUserDoc.id, ...newUserDoc.data() };
    updateAuthUI();
    loginModal.classList.remove("visible");
  } catch (error) {
    setStatusMessage("Failed to create account. Please try again.", "error");
    console.error("Sign up error:", error);
  }
}

async function handleSignIn(email, password) {
  try {
    // 1. Find user by email in 'clients' collection
    const userQuery = await db
      .collection("clients")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return setStatusMessage("Invalid email or password.", "error");
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // 2. Check if password matches
    if (userData.password !== password) {
      return setStatusMessage("Invalid email or password.", "error");
    }

    // 3. Set current user and update UI
    currentUser = { id: userDoc.id, ...userData };
    updateAuthUI();
    loginModal.classList.remove("visible");
  } catch (error) {
    setStatusMessage("Sign in failed. Please try again.", "error");
    console.error("Sign in error:", error);
  }
}

function setStatusMessage(message, type) {
  loginStatus.textContent = message;
  loginStatus.className = `form-status-message ${type}`;
  loginStatus.classList.toggle("visible", !!message);
}

function handleLogout() {
  currentUser = null;
  updateAuthUI();
  renderComicsGrid(getFilteredComics()); // Re-render to update favorite icons
}

function populateAvatarGrid() {
  avatarGrid.innerHTML = "";
  presetAvatars.forEach((avatarUrl) => {
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.className = "avatar-option";
    if (currentUser && currentUser.avatarUrl === avatarUrl) {
      img.classList.add("selected");
    }
    img.onclick = async () => {
      if (!currentUser) return;
      try {
        const userRef = db.collection("clients").doc(currentUser.id);
        await userRef.update({ avatarUrl });
        currentUser.avatarUrl = avatarUrl;
        updateAuthUI();
        avatarModal.classList.remove("visible");
      } catch (error) {
        console.error("Error updating avatar: ", error);
        alert("Failed to update avatar.");
      }
    };
    avatarGrid.appendChild(img);
  });
}

// --- FAVORITES LOGIC ---
async function toggleFavorite(comicData, heartIcon) {
  if (!currentUser) {
    loginModal.classList.add("visible");
    return;
  }

  const comicId = comicData.id;
  const isFavorited = currentUser.favorites.some((fav) => fav.id === comicId);
  const userRef = db.collection("clients").doc(currentUser.id);

  try {
    if (isFavorited) {
      const favoriteToRemove = currentUser.favorites.find(
        (fav) => fav.id === comicId
      );
      await userRef.update({
        favorites: firebase.firestore.FieldValue.arrayRemove(favoriteToRemove),
      });
      currentUser.favorites = currentUser.favorites.filter(
        (fav) => fav.id !== comicId
      );
      heartIcon.classList.remove("favorited");
    } else {
      const comicInfoForFavorite = {
        id: comicData.id,
        title: comicData.title,
        thumbnailUrl: comicData.thumbnailUrl,
        description: comicData.description || "",
      };
      await userRef.update({
        favorites:
          firebase.firestore.FieldValue.arrayUnion(comicInfoForFavorite),
      });
      currentUser.favorites.push(comicInfoForFavorite);
      heartIcon.classList.add("favorited");
    }
  } catch (error) {
    console.error("Error updating favorites:", error);
    alert("Could not update favorites. Please try again.");
  }
}

function showFavorites() {
  if (!currentUser) {
    loginModal.classList.add("visible");
    return;
  }

  favoritesGrid.innerHTML = "";
  if (currentUser.favorites.length === 0) {
    renderEmptyState(favoritesGrid, "You haven't favorited any comics yet.");
  } else {
    currentUser.favorites.forEach((favComicData) => {
      const card = createComicCard(favComicData);
      favoritesGrid.appendChild(card);
    });
  }
  favoritesModal.classList.add("visible");
}

// --- VIEW & RENDER FUNCTIONS ---
function createComicCard(comic) {
  const card = document.createElement("div");
  card.className = "comic-card";
  card.dataset.comicId = comic.id;

  const isFavorited = currentUser
    ? currentUser.favorites.some((fav) => fav.id === comic.id)
    : false;

  card.innerHTML = `
                <button class="favorite-btn ${
                  isFavorited ? "favorited" : ""
                }" data-tooltip="Favorite">
                    <i class="fas fa-heart"></i>
                </button>
                <div class="comic-thumbnail-container">
                    <img src="${comic.thumbnailUrl}" alt="${
    comic.title
  }" class="comic-thumbnail" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x600/2a2a2a/ffffff?text=No+Image'">
                </div>
                <div class="comic-info">
                    <h3 class="comic-title">${comic.title}</h3>
                    <p class="comic-description">${(
                      comic.description || ""
                    ).substring(0, 60)}...</p>
                </div>`;

  const favoriteBtn = card.querySelector(".favorite-btn");
  favoriteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(comic, favoriteBtn);
  });

  card
    .querySelector(".comic-thumbnail-container")
    .addEventListener("click", () => showDetailView(comic));
  card
    .querySelector(".comic-info")
    .addEventListener("click", () => showDetailView(comic));

  return card;
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
    const card = createComicCard(comic);
    card.style.animationDelay = `${index * 0.05}s`;
    fragment.appendChild(card);
  });
  comicsGrid.appendChild(fragment);
  renderPagination(comicsToRender);
}

function getFilteredComics() {
  let comicsToRender = allComics;
  const filterType = activeFilter.type;
  const filterValue = activeFilter.value;

  if (filterType === "search" && filterValue) {
    comicsToRender = allComics.filter(
      (comic) =>
        comic.title.toLowerCase().includes(filterValue) ||
        (comic.description || "").toLowerCase().includes(filterValue) ||
        (comic.author || "").toLowerCase().includes(filterValue) ||
        (comic.tags || []).some((tag) =>
          tag.toLowerCase().includes(filterValue)
        )
    );
  } else if (filterType === "category") {
    if (filterValue === "trending") {
      comicsToRender = [...allComics].sort(
        (a, b) => (b.recentViews || 0) - (a.recentViews || 0)
      );
    } else if (filterValue === "most-viewed") {
      comicsToRender = [...allComics].sort(
        (a, b) => (b.totalViews || 0) - (a.totalViews || 0)
      );
    } else if (filterValue !== "all") {
      comicsToRender = allComics.filter(
        (comic) => comic.category === filterValue
      );
    }
  } else if (filterType === "tag") {
    comicsToRender = allComics.filter(
      (comic) =>
        comic.tags &&
        Array.isArray(comic.tags) &&
        comic.tags.includes(filterValue)
    );
  }
  return comicsToRender;
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
  activeFilter = {
    type: "tag",
    value: tag,
  };
  showGridView();
  updateActiveFilters();
  renderComicsGrid(getFilteredComics());
}

function showGridView() {
  appView.style.display = "block";
  comicDetailView.style.display = "none";
  comicReaderView.style.display = "none";
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
  removeKeyboardListeners();
}

function showDetailView(comic) {
  currentComic = allComics.find((c) => c.id === comic.id) || comic; // Ensure we have the full comic object
  appView.style.display = "none";
  comicDetailView.style.display = "block";
  comicReaderView.style.display = "none";
  renderComicDetail(currentComic);
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
  removeKeyboardListeners();
}

function showReaderView(comic, part) {
  currentComic = comic;
  currentPartNumber = part.number;
  appView.style.display = "none";
  comicDetailView.style.display = "none";
  comicReaderView.style.display = "block";
  renderComicReader(comic, part);
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
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
    allComics = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    renderComicsGrid(allComics);
  } catch (err) {
    renderErrorState(comicsGrid, "Failed to load comics.");
    console.error(err);
  }
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
      activeFilter = {
        type: "category",
        value: categoryValue,
      };
      updateActiveFilters();
      renderComicsGrid(getFilteredComics());
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
  totalViewsContainer.textContent = comic.totalViews
    ? comic.totalViews.toLocaleString()
    : "0";
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

    const overridesMap = comic.partNameOverrides || {};
    const viewsSnapshot = await db
      .collection("comics")
      .doc(comic.id)
      .collection("part_views")
      .get();

    const viewsMap = new Map(
      viewsSnapshot.docs.map((doc) => [doc.id, doc.data().views || 0])
    );
    allPartsForCurrentComic = partsFromManifest.map((part, index) => {
      const partNumStr = String(part.number);
      const title =
        overridesMap[index] || `${comic.title} - Part ${part.number}`;
      const views = viewsMap.get(partNumStr) || 0;
      return {
        ...part,
        title,
        views,
      };
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
      part.views ? part.views.toLocaleString() : 0
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
  try {
    const comicRef = db.collection("comics").doc(comicId);
    const partRef = comicRef.collection("part_views").doc(String(partNumber));

    await db.runTransaction(async (transaction) => {
      const partDoc = await transaction.get(partRef);
      const newPartViews = (partDoc.data()?.views || 0) + 1;
      transaction.set(partRef, { views: newPartViews }, { merge: true });
      transaction.update(comicRef, {
        totalViews: firebase.firestore.FieldValue.increment(1),
      });
    });

    // --- FIX STARTS HERE ---
    // Update the local comic data to reflect the new total view count
    const comicIndex = allComics.findIndex((c) => c.id === comicId);
    if (comicIndex !== -1) {
      allComics[comicIndex].totalViews =
        (allComics[comicIndex].totalViews || 0) + 1;
      currentComic = allComics[comicIndex]; // Update currentComic as well
    }

    // If currently on the detail page, re-render the views section
    if (comicDetailView.style.display === "block") {
      const totalViewsContainer =
        comicDetailContent.querySelector("#detail-views span");
      if (totalViewsContainer) {
        totalViewsContainer.textContent =
          currentComic.totalViews.toLocaleString();
      }
    }
    // --- FIX ENDS HERE ---
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
    const card = createComicCard(comic);
    card.style.animationDelay = `${index * 0.05}s`;
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

function resetToHomeView() {
  showGridView();
  currentPage = 1;
  previousComicForTagFilter = null;
  activeFilter = {
    type: "category",
    value: "all",
  };
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
    statusMessage.className = "form-status-message error visible";
    setTimeout(() => {
      statusMessage.classList.remove("visible");
      setTimeout(() => (statusMessage.textContent = ""), 300);
    }, 3000);
    return;
  }
  try {
    await db
      .collection("emails") // CHANGED: Collection name updated to "emails"
      .add({
        email,
        subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    statusMessage.textContent = "Thank you for subscribing!";
    statusMessage.className = "form-status-message success visible";
    emailInput.value = "";
    setTimeout(() => {
      statusMessage.classList.remove("visible");
      setTimeout(() => (statusMessage.textContent = ""), 300);
    }, 3000);
  } catch (err) {
    statusMessage.textContent = "Failed to subscribe. Try again later.";
    statusMessage.className = "form-status-message error visible";
    console.error("Subscription error:", err);
    setTimeout(() => {
      statusMessage.classList.remove("visible");
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
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      break;
    case "End":
      e.preventDefault();
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
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

// --- EVENT LISTENERS & INITIALIZATION ---
function setupEventListeners() {
  // New Listeners for Auth Modal
  loginForm.addEventListener("submit", handleAuthFormSubmit);
  loginModalClose.addEventListener("click", () =>
    loginModal.classList.remove("visible")
  );
  avatarModalClose.addEventListener("click", () =>
    avatarModal.classList.remove("visible")
  );
  favoritesBtn.addEventListener("click", showFavorites);
  favoritesModalClose.addEventListener("click", () =>
    favoritesModal.classList.remove("visible")
  );

  // Add listeners for password toggles
  document.querySelectorAll(".password-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", togglePasswordVisibility);
  });

  // Initial toggle link setup
  document.getElementById("show-signup-btn").addEventListener("click", (e) => {
    e.preventDefault();
    toggleAuthMode("signup");
  });

  // Close modal on backdrop click
  [loginModal, avatarModal, favoritesModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("visible");
      }
    });
  });

  // Footer Modals
  const supportModals = [
    {
      linkId: "help-center-link",
      modalId: "help-center-modal",
      closeId: "help-center-modal-close",
    },
    {
      linkId: "privacy-policy-link",
      modalId: "privacy-policy-modal",
      closeId: "privacy-policy-modal-close",
    },
    {
      linkId: "terms-service-link",
      modalId: "terms-service-modal",
      closeId: "terms-service-modal-close",
    },
    {
      linkId: "about-us-link",
      modalId: "about-us-modal",
      closeId: "about-us-modal-close",
    },
    {
      linkId: "help-center-link-detail",
      modalId: "help-center-modal",
      closeId: "help-center-modal-close",
    },
    {
      linkId: "privacy-policy-link-detail",
      modalId: "privacy-policy-modal",
      closeId: "privacy-policy-modal-close",
    },
    {
      linkId: "terms-service-link-detail",
      modalId: "terms-service-modal",
      closeId: "terms-service-modal-close",
    },
    {
      linkId: "about-us-link-detail",
      modalId: "about-us-modal",
      closeId: "about-us-modal-close",
    },
  ];

  supportModals.forEach((item) => {
    const link = document.getElementById(item.linkId);
    const modal = document.getElementById(item.modalId);
    const closeBtn = document.getElementById(item.closeId);

    link.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.add("visible");
    });

    closeBtn.addEventListener("click", () => {
      modal.classList.remove("visible");
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("visible");
      }
    });
  });

  // Existing Listeners
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
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
    updateAuthUI(); // Initial UI setup for auth
    populateAvatarGrid();
    await loadComics();
    await loadAndRenderCategories();
  } catch (err) {
    console.error("Initialization error:", err);
    renderErrorState(comicsGrid, "Failed to initialize the app.");
  }
}

init();
