const firebaseConfig = {
  apiKey: "AIzaSyCwkRk12HxQlQS2DH12lcolRNvF2ALprZM",
  authDomain: "comix-9be69.firebaseapp.com",
  projectId: "comix-9be69",
  storageBucket: "comix-9be69.appspot.com",
  messagingSenderId: "346083786632",
  appId: "1:346083786632:web:f95c8c3dacafe47f23843d",
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentComicToDelete = null;
let currentComicToEdit = null;
let allComics = [];
let unsubscribeComics = null;
let selectedPfpUrl = null;

const authContainer = document.getElementById("auth-container");
const adminDashboard = document.getElementById("admin-dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const comicForm = document.getElementById("comic-form");
const comicsGrid = document.getElementById("admin-comics-grid");
const searchInput = document.getElementById("search-comics");
const deleteModal = document.getElementById("delete-modal");
const editModal = document.getElementById("edit-modal");
const toastContainer = document.getElementById("toast-container");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const userProfileImg = document.getElementById("user-profile-img");
const pfpModal = document.getElementById("pfp-modal");
const presetAvatarsGrid = document.getElementById("preset-avatars-grid");
const savePfpBtn = document.getElementById("save-pfp-btn");
const deleteAllActivitiesBtn = document.getElementById(
  "delete-all-activities-btn"
);
const recentActivityList = document.getElementById("recent-activity-list");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const backupBtn = document.getElementById("backup-data-btn");
const restoreBtn = document.getElementById("restore-data-btn");
const restoreFileInput = document.getElementById("restore-file-input");
const totalComicsEl = document.getElementById("total-comics");
const activeUsersEl = document.getElementById("active-users");
const pageViewsEl = document.getElementById("page-views");
const comicCategorySelect = document.getElementById("comic-category");
const editComicCategorySelect = document.getElementById("edit-comic-category");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");

const sectionContents = {
  dashboard: document.getElementById("dashboard-section"),
  comics: document.getElementById("comics-section"),
  categories: document.getElementById("categories-section"),
  users: document.getElementById("users-section"),
  settings: document.getElementById("settings-section"),
};

const presetAvatars = [
  { style: "fun-emoji", seed: "Angry" },
  { style: "fun-emoji", seed: "Blushing" },
  { style: "fun-emoji", seed: "Concerned" },
  { style: "fun-emoji", seed: "Cool" },
  { style: "fun-emoji", seed: "Crying" },
  { style: "fun-emoji", seed: "Driven" },
  { style: "fun-emoji", seed: "Excited" },
  { style: "fun-emoji", seed: "Happy" },
  { style: "fun-emoji", seed: "Hurt" },
  { style: "fun-emoji", seed: "Innocent" },
  { style: "fun-emoji", seed: "Love" },
  { style: "fun-emoji", seed: "LOL" },
  { style: "fun-emoji", seed: "Sad" },
  { style: "fun-emoji", seed: "Shocked" },
  { style: "fun-emoji", seed: "Sleeping" },
  { style: "fun-emoji", seed: "Smile" },
  { style: "fun-emoji", seed: "Surprised" },
  { style: "fun-emoji", seed: "Tired" },
  { style: "fun-emoji", seed: "Vomiting" },
  { style: "fun-emoji", seed: "Winking" },
  { style: "fun-emoji", seed: "Grumpy" },
  { style: "fun-emoji", seed: "Confused" },
  { style: "fun-emoji", seed: "Silly" },
  { style: "fun-emoji", seed: "Nervous" },
  { style: "fun-emoji", seed: "Joyful" },
  { style: "fun-emoji", seed: "Screaming" },
  { style: "fun-emoji", seed: "Daydreaming" },
  { style: "fun-emoji", seed: "Goofy" },
  { style: "fun-emoji", seed: "Yawning" },
  { style: "adventurer", seed: "Midnight" },
  { style: "adventurer", seed: "Snowball" },
  { style: "adventurer", seed: "Smokey" },
  { style: "adventurer", seed: "Shadow" },
  { style: "adventurer", seed: "Muffin" },
  { style: "adventurer", seed: "Garfield" },
  { style: "adventurer", seed: "Felix" },
  { style: "adventurer", seed: "Boots" },
  { style: "adventurer", seed: "Precious" },
  { style: "adventurer", seed: "Coco" },
  { style: "adventurer", seed: "Misty" },
  { style: "adventurer", seed: "Peanut" },
  { style: "adventurer", seed: "Pumpkin" },
  { style: "adventurer", seed: "Sassy" },
  { style: "adventurer", seed: "Gizmo" },
  { style: "adventurer", seed: "Leo" },
  { style: "adventurer", seed: "Loki" },
  { style: "adventurer", seed: "Max" },
  { style: "adventurer", seed: "Milo" },
  { style: "adventurer", seed: "Oliver" },
  { style: "adventurer", seed: "Oreo" },
  { style: "adventurer", seed: "Rocky" },
  { style: "adventurer", seed: "Simba" },
  { style: "adventurer", seed: "Tiger" },
  { style: "adventurer", seed: "Tigger" },
  { style: "adventurer", seed: "Toby" },
  { style: "adventurer", seed: "Ziggy" },
  { style: "adventurer", seed: "Zoe" },
  { style: "adventurer", seed: "Abby" },
  { style: "adventurer", seed: "Angel" },
  { style: "adventurer", seed: "Annie" },
  { style: "adventurer", seed: "Baby" },
  { style: "adventurer", seed: "Bella" },
  { style: "adventurer", seed: "Callie" },
  { style: "adventurer", seed: "Chloe" },
  { style: "adventurer", seed: "Cleo" },
  { style: "adventurer", seed: "Cookie" },
  { style: "adventurer", seed: "Daisy" },
  { style: "adventurer", seed: "Bandit" },
  { style: "adventurer", seed: "Waffles" },
  { style: "adventurer", seed: "Tuna" },
  { style: "adventurer", seed: "Mocha" },
  { style: "adventurer", seed: "Nugget" },
  { style: "adventurer", seed: "Fudge" },
  { style: "adventurer", seed: "Snickers" },
  { style: "adventurer", seed: "Mochi" },
  { style: "adventurer", seed: "Captain Cringe" },
  { style: "adventurer", seed: "Professor LOL" },
  { style: "adventurer", seed: "Disco Dadi" },
  { style: "adventurer", seed: "Lazy Ladka" },
  { style: "adventurer", seed: "Zoom Baba" },
  { style: "adventurer", seed: "Sleepy Senpai" },
  { style: "adventurer", seed: "Roti Boy" },
  { style: "adventurer", seed: "Emo Engineer" },
  { style: "adventurer", seed: "Biryani Bhai" },
  { style: "adventurer", seed: "Samosa Uncle" },
  { style: "adventurer", seed: "Chappal Hero" },
  { style: "adventurer", seed: "Drama Queen" },
  { style: "adventurer", seed: "Memer Boi" },
  { style: "adventurer", seed: "Sticker Girl" },
  { style: "adventurer", seed: "Emoji King" },
  { style: "adventurer", seed: "Sleep Deprived" },
  { style: "adventurer", seed: "Baba OP" },
  { style: "adventurer", seed: "Sir LOLalot" },
  { style: "adventurer", seed: "Buggy Coder" },
  { style: "adventurer", seed: "Chaddi Hacker" },
  { style: "adventurer", seed: "Tharki Dev" },
  { style: "adventurer", seed: "Silent Simp" },
  { style: "adventurer", seed: "Cringe Monk" },
  { style: "adventurer", seed: "Awkward Dude" },
  { style: "adventurer", seed: "Bakwaas Boss" },
  { style: "adventurer", seed: "Lassi Lover" },
  { style: "adventurer", seed: "K-drama King" },
  { style: "adventurer", seed: "Code Zombie" },
  { style: "adventurer", seed: "Snack Hacker" },
  { style: "adventurer", seed: "Dancing Toaster" },
  { style: "adventurer", seed: "Crying Lightbulb" },
  { style: "adventurer", seed: "Angry Remote" },
  { style: "adventurer", seed: "Broken Phone" },
  { style: "adventurer", seed: "Grinning Keyboard" },
  { style: "adventurer", seed: "Confused Fridge" },
  { style: "adventurer", seed: "Sassy WashingMachine" },
  { style: "adventurer", seed: "Chill Fan" },
  { style: "adventurer", seed: "Sweaty AC" },
  { style: "adventurer", seed: "Hyper Speaker" },
  { style: "adventurer", seed: "Shy Clock" },
  { style: "adventurer", seed: "Furious Pen" },
  { style: "adventurer", seed: "Lost Sock" },
  { style: "adventurer", seed: "Bossy Backpack" },
  { style: "adventurer", seed: "Screaming Bell" },
  { style: "adventurer", seed: "Sad Stapler" },
  { style: "adventurer", seed: "Buffering Router" },
  { style: "adventurer", seed: "Smart Dustbin" },
  { style: "adventurer", seed: "Romantic Chair" },
  { style: "adventurer", seed: "Rolling Mouse" },
  { style: "adventurer", seed: "Buff Banana" },
  { style: "adventurer", seed: "Angry Apple" },
  { style: "adventurer", seed: "Dramatic Donut" },
  { style: "adventurer", seed: "Hotdog Hero" },
  { style: "adventurer", seed: "Dancing Pizza" },
  { style: "adventurer", seed: "Snoring Sandwich" },
  { style: "adventurer", seed: "Tired Taco" },
  { style: "adventurer", seed: "Sassy Samosa" },
  { style: "adventurer", seed: "Freaky Fries" },
  { style: "adventurer", seed: "Laughing Lollipop" },
  { style: "adventurer", seed: "Bitter Broccoli" },
  { style: "adventurer", seed: "Killer Ketchup" },
  { style: "adventurer", seed: "Biryani Baby" },
  { style: "adventurer", seed: "PaniPuri Panda" },
  { style: "adventurer", seed: "Chilli Chap" },
  { style: "adventurer", seed: "Veggie Vampire" },
  { style: "adventurer", seed: "Spicy Mango" },
  { style: "adventurer", seed: "Thirsty Coconut" },
  { style: "adventurer", seed: "Juicy Jam" },
  { style: "adventurer", seed: "Paratha Pataka" },
  { style: "adventurer", seed: "Kaju Katli Kid" },
  { style: "adventurer", seed: "Paneer Punch" },
  { style: "adventurer", seed: "Momo Mania" },
  { style: "adventurer", seed: "Captain Pajamas" },
  { style: "adventurer", seed: "Sir Sleepalot" },
  { style: "adventurer", seed: "Professor Confused" },
  { style: "adventurer", seed: "Agent Cringe" },
  { style: "adventurer", seed: "Colonel Curry" },
  { style: "adventurer", seed: "Meme Monk" },
  { style: "adventurer", seed: "Dancing Dad" },
  { style: "adventurer", seed: "Zoom Call Zombie" },
  { style: "adventurer", seed: "Intern of Chaos" },
  { style: "adventurer", seed: "Uncle Troll" },
  { style: "adventurer", seed: "Miss Giggles" },
  { style: "adventurer", seed: "Bhaiya Buffer" },
  { style: "adventurer", seed: "DJ Dadi" },
  { style: "adventurer", seed: "Biryani Boss" },
  { style: "adventurer", seed: "Samosa Soldier" },
  { style: "adventurer", seed: "Crying Coder" },
  { style: "adventurer", seed: "Lagging Ladka" },
  { style: "adventurer", seed: "Sir LOLalot" },
  { style: "adventurer", seed: "Tired Tiktoker" },
  { style: "adventurer", seed: "Drama Didi" },
  { style: "adventurer", seed: "Chai Champion" },
  { style: "adventurer", seed: "Bug Fix Baba" },
  { style: "adventurer", seed: "CEO of Nothing" },
  { style: "adventurer", seed: "Baba Buffer" },
  { style: "adventurer", seed: "Sharma Ji Beta" },
  { style: "adventurer", seed: "Lazy Lecturer" },
  { style: "adventurer", seed: "Chappal Warrior" },
  { style: "adventurer", seed: "Chintu Hacker" },
  { style: "adventurer", seed: "Roti Revolutionist" },
  { style: "adventurer", seed: "Cringe Cousin" },
  { style: "adventurer", seed: "Tharki Devdas" },
  { style: "adventurer", seed: "Silent Simp" },
  { style: "adventurer", seed: "Sanskari Slayer" },
  { style: "adventurer", seed: "Sleep Deprived Developer" },
  { style: "adventurer", seed: "404 Personality" },
  { style: "adventurer", seed: "Cringe King" },
  { style: "adventurer", seed: "Emo Engineer" },
  { style: "adventurer", seed: "Nerdy Ninja" },
  { style: "adventurer", seed: "Snack Pirate" },
  { style: "adventurer", seed: "Drama King" },
  { style: "adventurer", seed: "Bathroom Singer" },
  { style: "adventurer", seed: "Code Chacha" },
  { style: "adventurer", seed: "Woke Uncle" },
  { style: "adventurer", seed: "K-drama Killer" },
  { style: "adventurer", seed: "Whiny Winner" },
  { style: "adventurer", seed: "Emotional Entrepreneur" },
  { style: "adventurer", seed: "Freaky Freelancer" },
  { style: "adventurer", seed: "Crybaby Influencer" },
  { style: "adventurer", seed: "Confused Coder" },
  { style: "adventurer", seed: "TooMuchTalker" },
  { style: "adventurer", seed: "Chill Bro" },
  { style: "adventurer", seed: "Bhindi Bodybuilder" },
  { style: "adventurer", seed: "Jugaadu Genius" },
  { style: "adventurer", seed: "Mood Swing Maharaja" },
  { style: "adventurer", seed: "Tandoori Teacher" },
  { style: "adventurer", seed: "Naagin Nani" },
  { style: "adventurer", seed: "TikTok Tycoon" },
  { style: "adventurer", seed: "Flexi Fakir" },
  { style: "adventurer", seed: "Gossip Guru" },
  { style: "adventurer", seed: "Lassi Lover" },
  { style: "adventurer", seed: "Sad Startup Founder" },
  { style: "adventurer", seed: "Beta Tester Baba" },
  { style: "adventurer", seed: "FOMO Fella" },
  { style: "adventurer", seed: "Zoom Zombie" },
  { style: "adventurer", seed: "Lazy Lord" },
  { style: "adventurer", seed: "Witty Watchman" },
  { style: "adventurer", seed: "Dance Floor Dev" },
  { style: "adventurer", seed: "Silly Sibling" },
];

const toggleButtonLoading = (btn, isLoading) => {
  const spinner = btn.querySelector(".loading-spinner");
  const textSpan = btn.querySelector("span:not(.loading-spinner)");
  btn.disabled = isLoading;
  if (spinner) spinner.classList.toggle("hidden", !isLoading);
  if (textSpan) textSpan.classList.toggle("hidden", isLoading);
};

const applyInitialTheme = () => {
  const theme = localStorage.getItem("theme") || "light";
  setTheme(theme);
};

const setTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  themeToggleBtn.innerHTML = `<i class="fas ${
    theme === "dark" ? "fa-sun" : "fa-moon"
  }"></i>`;
  darkModeToggle.checked = theme === "dark";
};

const showSection = (sectionKey) => {
  document
    .querySelectorAll(".menu-item")
    .forEach((item) =>
      item.classList.toggle("active", item.dataset.section === sectionKey)
    );
  Object.values(sectionContents).forEach((el) =>
    el.classList.remove("is-active")
  );
  const sectionToShow = sectionContents[sectionKey];
  if (sectionToShow) {
    sectionToShow.classList.add("is-active");
  }
  document.getElementById("section-title").textContent =
    sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
};

const showToast = (type, title, message) => {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
  };
  toast.innerHTML = `<div class="toast-icon"><i class="fas ${icons[type]}"></i></div><div><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div><button class="toast-close">&times;</button>`;
  toastContainer.appendChild(toast);
  const timer = setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 400);
  }, 5000);
  toast.querySelector(".toast-close").onclick = () => {
    clearTimeout(timer);
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 400);
  };
};

async function logActivity(action, details) {
  try {
    const user = auth.currentUser;
    await db.collection("activity_log").add({
      action: action,
      details: details,
      userEmail: user ? user.email : "Unknown",
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "Just now";
  const now = new Date();
  const seconds = Math.floor((now - timestamp.toDate()) / 1000);
  if (seconds < 5) return "Just now";
  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  for (let unit in intervals) {
    let interval = seconds / intervals[unit];
    if (interval > 1) {
      const value = Math.floor(interval);
      return `${value} ${unit}${value > 1 ? "s" : ""} ago`;
    }
  }
  return Math.floor(seconds) + " seconds ago";
}

function loadRecentActivity() {
  const listContainer = document.getElementById("recent-activity-list");
  db.collection("activity_log")
    .orderBy("timestamp", "desc")
    .limit(10)
    .onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          listContainer.innerHTML = "<p>No recent activity found.</p>";
          return;
        }
        let activityHtml = '<ul class="activity-list">';
        snapshot.forEach((doc) => {
          const activity = doc.data();
          const docId = doc.id;
          let icon = "fa-plus-circle";
          if (activity.action.includes("Edited")) icon = "fa-pencil-alt";
          if (activity.action.includes("Deleted")) icon = "fa-trash-alt";
          if (activity.action.includes("Category")) icon = "fa-tags";
          activityHtml += `
                <li class="activity-item">
                    <i class="fas ${icon}" style="margin-right: 12px; color: var(--text-gray);"></i>
                    <div class="activity-details">
                        <strong>${activity.action}:</strong> ${activity.details}
                    </div>
                    <div class="activity-time">${formatTimeAgo(
                      activity.timestamp
                    )}</div>
                    <button class="delete-activity-btn" data-id="${docId}" title="Delete Activity"><i class="fas fa-trash"></i></button>
                </li>`;
        });
        activityHtml += "</ul>";
        listContainer.innerHTML = activityHtml;
      },
      (err) => {
        console.error("Error loading activity:", err);
        listContainer.innerHTML =
          '<p style="color:red;">Could not load activity.</p>';
      }
    );
}

async function deleteAllActivities() {
  if (
    !confirm(
      "Are you sure you want to delete ALL activities? This action cannot be undone."
    )
  )
    return;
  const activityQuery = await db.collection("activity_log").get();
  if (activityQuery.empty) {
    showToast("info", "All Clear", "There are no activities to delete.");
    return;
  }
  const batch = db.batch();
  activityQuery.docs.forEach((doc) => batch.delete(doc.ref));
  try {
    await batch.commit();
    showToast("success", "Success", "All activities have been deleted.");
  } catch (err) {
    showToast("error", "Error", "Could not delete all activities.");
    console.error(err);
  }
}

function openPfpModal() {
  presetAvatarsGrid.innerHTML = "";
  presetAvatars.forEach((avatar) => {
    const img = document.createElement("img");
    const style = avatar.style || "adventurer";
    img.src = `https://api.dicebear.com/7.x/${style}/svg?seed=${avatar.seed}&radius=50`;
    img.className = "preset-avatar";
    img.dataset.url = img.src;
    img.onclick = () => handlePresetAvatarClick(img);
    presetAvatarsGrid.appendChild(img);
  });
  selectedPfpUrl = null;
  savePfpBtn.classList.add("hidden");
  document
    .querySelectorAll(".preset-avatar.selected")
    .forEach((el) => el.classList.remove("selected"));
  pfpModal.classList.add("show");
}

async function saveProfilePicture() {
  if (!selectedPfpUrl) return;
  toggleButtonLoading(savePfpBtn, true);
  try {
    await db
      .collection("settings")
      .doc("admin_profile")
      .set({ profilePictureUrl: selectedPfpUrl }, { merge: true });
    userProfileImg.src = selectedPfpUrl;
    pfpModal.classList.remove("show");
    showToast("success", "Success!", "Profile picture updated.");
  } catch (error) {
    showToast("error", "Error", "Could not save profile picture.");
    console.error(error);
  } finally {
    toggleButtonLoading(savePfpBtn, false);
  }
}

function handlePresetAvatarClick(imgElement) {
  document
    .querySelectorAll(".preset-avatar.selected")
    .forEach((el) => el.classList.remove("selected"));
  imgElement.classList.add("selected");
  selectedPfpUrl = imgElement.dataset.url;
  savePfpBtn.classList.remove("hidden");
}

async function loadAdminProfile() {
  try {
    const doc = await db.collection("settings").doc("admin_profile").get();
    if (doc.exists && doc.data().profilePictureUrl) {
      userProfileImg.src = doc.data().profilePictureUrl;
    }
  } catch (error) {
    console.error("Could not load admin profile:", error);
  }
}

async function backupData() {
  toggleButtonLoading(backupBtn, true);
  showToast("info", "Backup Started", "Fetching data from collections...");
  const collectionsToBackup = [
    "comics",
    "categories",
    "activity_log",
    "settings",
  ];
  const zip = new JSZip();
  try {
    for (const collectionName of collectionsToBackup) {
      const snapshot = await db.collection(collectionName).get();
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const replacer = (key, value) =>
        value && value.seconds !== undefined
          ? new Date(value.seconds * 1000).toISOString()
          : value;
      zip.file(`${collectionName}.json`, JSON.stringify(data, replacer, 2));
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = `comixall-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast("success", "Backup Complete", "Your data has been downloaded.");
  } catch (error) {
    showToast("error", "Backup Failed", error.message);
    console.error(error);
  } finally {
    toggleButtonLoading(backupBtn, false);
  }
}

async function restoreData(event) {
  if (!firebase.auth().currentUser) {
    showToast(
      "error",
      "Restore Failed",
      "Admin not logged in. Please login first."
    );
    return;
  }
  const file = event.target.files[0];
  if (!file) return;
  if (
    !confirm(
      "Are you sure you want to restore data? This will overwrite existing data."
    )
  ) {
    restoreFileInput.value = "";
    return;
  }
  toggleButtonLoading(restoreBtn, true);
  showToast("info", "Restore Started", "Reading backup file...");
  try {
    const zip = await JSZip.loadAsync(file);
    for (const filename in zip.files) {
      if (
        !filename.endsWith(".json") ||
        filename.split("/").some((part) => part.startsWith("._"))
      ) {
        continue;
      }
      const rawName = filename.replace(".json", "");
      const collectionName = rawName.includes("/")
        ? rawName.split("/").pop()
        : rawName;
      const content = await zip.file(filename).async("string");
      const data = JSON.parse(content);
      showToast("info", `Restoring...`, `Uploading data to ${collectionName}.`);
      for (let i = 0; i < data.length; i += 499) {
        const batch = db.batch();
        const chunk = data.slice(i, i + 499);
        chunk.forEach((item) => {
          const segments = collectionName.split("/");
          let ref = db.collection(segments[0]);
          for (let j = 1; j < segments.length; j++) {
            if (j % 2 === 1) {
              ref = ref.doc(segments[j]);
            } else {
              ref = ref.collection(segments[j]);
            }
          }
          const { id, ...docData } = item;
          const docRef = segments.length % 2 === 1 ? ref.doc(id) : ref;
          Object.keys(docData).forEach((key) => {
            if (
              typeof docData[key] === "string" &&
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(docData[key])
            ) {
              docData[key] = firebase.firestore.Timestamp.fromDate(
                new Date(docData[key])
              );
            }
          });
          batch.set(docRef, docData);
        });
        try {
          await batch.commit();
        } catch (err) {
          console.error("Batch commit error:", err);
          throw err;
        }
      }
    }
    showToast(
      "success",
      "Restore Complete",
      "Data has been successfully restored."
    );
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    showToast("error", "Restore Failed", error.message);
    console.error(error);
  } finally {
    toggleButtonLoading(restoreBtn, false);
    restoreFileInput.value = "";
  }
}

async function adminLogin() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";
  toggleButtonLoading(loginBtn, true);
  try {
    await auth.signInWithEmailAndPassword(email, password);
    showToast("success", "Login Successful", "Welcome!");
  } catch (err) {
    errorEl.textContent = "Invalid credentials. Please try again.";
  } finally {
    toggleButtonLoading(loginBtn, false);
  }
}

async function handleComicSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("submit-comic");
  toggleButtonLoading(submitBtn, true);
  const comicData = {
    title: document.getElementById("comic-title").value,
    author: document.getElementById("comic-author").value,
    folderName: document.getElementById("comic-folder").value,
    category: document.getElementById("comic-category").value,
    tags: document
      .getElementById("comic-tags")
      .value.split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    description: document.getElementById("comic-description").value,
    thumbnailUrl: document.getElementById("comic-thumbnail").value,
    manifestUrl: document.getElementById("comic-manifest-url").value,
    totalViews: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (!comicData.title || !comicData.thumbnailUrl || !comicData.manifestUrl) {
    showToast(
      "error",
      "Validation Error",
      "Title, Thumbnail, and Manifest URL are required."
    );
    toggleButtonLoading(submitBtn, false);
    return;
  }
  try {
    await db.collection("comics").add(comicData);
    await logActivity("Comic Added", comicData.title);
    showToast("success", "Success!", "Comic added successfully.");
    comicForm.reset();
  } catch (err) {
    showToast("error", "Error", `Failed to add comic: ${err.message}`);
  } finally {
    toggleButtonLoading(submitBtn, false);
  }
}

async function openEditModal(comic) {
  currentComicToEdit = comic;
  document.getElementById("edit-comic-id").value = comic.id;
  document.getElementById("edit-comic-title").value = comic.title;
  document.getElementById("edit-comic-author").value = comic.author || "";
  document.getElementById("edit-comic-folder").value = comic.folderName;
  document.getElementById("edit-comic-category").value = comic.category || "";
  document.getElementById("edit-comic-tags").value =
    comic.tags?.join(", ") || "";
  document.getElementById("edit-comic-thumbnail").value = comic.thumbnailUrl;
  document.getElementById("edit-comic-description").value =
    comic.description || "";
  document.getElementById("edit-comic-manifest-url").value =
    comic.manifestUrl || "";

  const overridesContainer = document.getElementById(
    "part-overrides-container"
  );
  overridesContainer.innerHTML = "<p>Loading parts from Gist...</p>";
  editModal.classList.add("show");
  try {
    if (!comic.manifestUrl) throw new Error("Manifest URL is missing.");
    const response = await fetch(comic.manifestUrl);
    if (!response.ok)
      throw new Error("Could not fetch manifest file. Check URL.");
    const manifest = await response.json();
    const parts = manifest.parts || [];
    if (parts.length === 0) {
      overridesContainer.innerHTML =
        "<p>No parts found in the manifest file.</p>";
      return;
    }
    const overridesSnapshot = await db
      .collection("comics")
      .doc(comic.id)
      .collection("part_overrides")
      .get();
    const overridesMap = new Map(
      overridesSnapshot.docs.map((doc) => [doc.id, doc.data().title])
    );
    overridesContainer.innerHTML = "";
    parts.forEach((part) => {
      const defaultName = `${comic.title} - Part ${part.number}`;
      const overrideName = overridesMap.get(String(part.number)) || "";
      const item = document.createElement("div");
      item.style.cssText =
        "display:grid; grid-template-columns:auto 1fr; gap:1rem; align-items:center; margin-bottom:1rem;";
      item.innerHTML = `
                <label style="font-size:0.9em; color: var(--text-gray);" for="part-override-${part.number}">Part ${part.number}</label>
                <input type="text" id="part-override-${part.number}" data-part-number="${part.number}" class="form-control" value="${overrideName}" placeholder="Default: ${defaultName}">`;
      overridesContainer.appendChild(item);
    });
  } catch (error) {
    overridesContainer.innerHTML = `<p style="color:var(--error);">Error loading parts: ${error.message}</p>`;
  }
}

async function saveComicEdit() {
  if (!currentComicToEdit) return;
  const saveBtn = document.getElementById("save-edit");
  toggleButtonLoading(saveBtn, true);
  const comicId = currentComicToEdit.id;
  const updatedData = {
    title: document.getElementById("edit-comic-title").value,
    author: document.getElementById("edit-comic-author").value,
    folderName: document.getElementById("edit-comic-folder").value,
    category: document.getElementById("edit-comic-category").value,
    tags: document
      .getElementById("edit-comic-tags")
      .value.split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    description: document.getElementById("edit-comic-description").value,
    thumbnailUrl: document.getElementById("edit-comic-thumbnail").value,
    manifestUrl: document.getElementById("edit-comic-manifest-url").value,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  const batch = db.batch();
  const comicRef = db.collection("comics").doc(comicId);
  batch.update(comicRef, updatedData);
  document
    .querySelectorAll("#part-overrides-container input")
    .forEach((input) => {
      const partNumber = input.dataset.partNumber;
      const customTitle = input.value.trim();
      const overrideRef = comicRef
        .collection("part_overrides")
        .doc(String(partNumber));
      if (customTitle) batch.set(overrideRef, { title: customTitle });
      else batch.delete(overrideRef);
    });
  try {
    await batch.commit();
    await logActivity("Comic Edited", updatedData.title);
    showToast("success", "Updated!", "Comic details and part names saved.");
    editModal.classList.remove("show");
  } catch (err) {
    showToast("error", "Save Failed", err.message);
  } finally {
    toggleButtonLoading(saveBtn, false);
    currentComicToEdit = null;
  }
}

async function deleteComic() {
  if (!currentComicToDelete) return;
  const { id: comicId, title: comicTitle } = currentComicToDelete;
  try {
    const comicRef = db.collection("comics").doc(comicId);
    const overridesSnapshot = await comicRef.collection("part_overrides").get();
    const viewsSnapshot = await comicRef.collection("part_views").get();
    const batch = db.batch();
    overridesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    viewsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(comicRef);
    await batch.commit();
    await logActivity("Comic Deleted", comicTitle);
    showToast("success", "Deleted", `Comic "${comicTitle}" removed.`);
    deleteModal.classList.remove("show");
    currentComicToDelete = null;
  } catch (err) {
    showToast("error", "Error", "Failed to delete comic.");
  }
}

function setupComicsListener() {
  if (unsubscribeComics) unsubscribeComics();
  unsubscribeComics = db
    .collection("comics")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        allComics = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderAllComics(allComics);
        totalComicsEl.textContent = snapshot.size;
        pageViewsEl.textContent = allComics.reduce(
          (sum, comic) => sum + (comic.totalViews || 0),
          0
        );
      },
      (err) => showToast("error", "Error", "Failed to load comics.")
    );
}

function renderAllComics(comicsArray) {
  comicsGrid.innerHTML = "";
  if (comicsArray.length === 0) {
    comicsGrid.innerHTML = `<p style="color: var(--text-gray); grid-column: 1 / -1;">No comics found.</p>`;
    return;
  }
  comicsArray.forEach((comic, index) => {
    const card = document.createElement("div");
    card.className = "comic-card";
    card.style.setProperty("--i", index);
    card.innerHTML = `
            <div class="image-container">
                <img src="${comic.thumbnailUrl}" alt="${
      comic.title
    }" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/160x240?text=No+Image';">
            </div>
            <div class="comic-body">
                <h3 class="comic-title" title="${comic.title}">${
      comic.title
    }</h3>
                <p class="comic-author">${comic.author || "N/A"}</p>
            </div>`;
    card.addEventListener("click", () => openEditModal(comic));
    comicsGrid.appendChild(card);
  });
}

function loadAdminCategories() {
  db.collection("categories")
    .orderBy("name")
    .onSnapshot((snapshot) => {
      const listEl = document.getElementById("categories-list-admin");
      listEl.innerHTML = "";
      snapshot.forEach((doc, i) => {
        const cat = { id: doc.id, ...doc.data() };
        const item = document.createElement("li");
        item.className = "category-admin-item";
        item.style.setProperty("--i", i);
        item.innerHTML = `<span>${cat.name}</span><button class="btn btn-xs btn-danger">Delete</button>`;
        item.querySelector("button").onclick = async () => {
          if (confirm(`Delete "${cat.name}"? This is permanent.`)) {
            await db.collection("categories").doc(cat.id).delete();
            await logActivity("Category Deleted", cat.name);
            showToast("success", "Deleted", `Category "${cat.name}" removed.`);
          }
        };
        listEl.appendChild(item);
      });
    });
}

function loadCategoriesIntoSelects() {
  db.collection("categories")
    .orderBy("name")
    .onSnapshot((snapshot) => {
      let optionsHtml =
        '<option value="" disabled selected>Select a Category</option>';
      snapshot.forEach(
        (doc) =>
          (optionsHtml += `<option value="${doc.data().value}">${
            doc.data().name
          }</option>`)
      );
      comicCategorySelect.innerHTML = optionsHtml;
      editComicCategorySelect.innerHTML = optionsHtml;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  applyInitialTheme();
  auth.onAuthStateChanged((user) => {
    if (user) {
      authContainer.classList.add("hidden");
      adminDashboard.classList.remove("hidden");
      setupComicsListener();
      loadAdminCategories();
      loadCategoriesIntoSelects();
      loadRecentActivity();
      loadAdminProfile();
      activeUsersEl.textContent = "N/A";
      showSection("dashboard");
    } else {
      adminDashboard.classList.add("hidden");
      authContainer.classList.remove("hidden");
      if (unsubscribeComics) unsubscribeComics();
    }
  });

  loginBtn.addEventListener("click", adminLogin);
  logoutBtn.addEventListener("click", () => auth.signOut());
  document
    .querySelectorAll(".menu-item")
    .forEach((item) =>
      item.addEventListener("click", (e) =>
        showSection(e.currentTarget.dataset.section)
      )
    );
  comicForm.addEventListener("submit", handleComicSubmit);
  document.getElementById("save-edit").addEventListener("click", saveComicEdit);
  document
    .getElementById("cancel-edit")
    .addEventListener("click", () => editModal.classList.remove("show"));
  document
    .getElementById("edit-modal-close")
    .addEventListener("click", () => editModal.classList.remove("show"));
  document
    .getElementById("delete-from-modal-btn")
    .addEventListener("click", () => {
      if (currentComicToEdit) {
        currentComicToDelete = currentComicToEdit;
        editModal.classList.remove("show");
        deleteModal.classList.add("show");
      }
    });
  document
    .getElementById("confirm-delete")
    .addEventListener("click", deleteComic);
  document
    .getElementById("cancel-delete")
    .addEventListener("click", () => deleteModal.classList.remove("show"));
  deleteModal
    .querySelector(".modal-close")
    .addEventListener("click", () => deleteModal.classList.remove("show"));
  document
    .getElementById("category-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("category-name-input");
      const name = input.value.trim();
      if (!name) return;
      try {
        await db
          .collection("categories")
          .add({ name, value: name.toLowerCase().replace(/\s+/g, "-") });
        await logActivity("Category Added", name);
        showToast("success", "Added!", `Category "${name}" created.`);
        input.value = "";
      } catch (err) {
        showToast("error", "Error", err.message);
      }
    });
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    renderAllComics(
      allComics.filter(
        (c) =>
          c.title.toLowerCase().includes(term) ||
          c.author.toLowerCase().includes(term)
      )
    );
  });
  userProfileImg.addEventListener("click", openPfpModal);
  savePfpBtn.addEventListener("click", saveProfilePicture);
  pfpModal
    .querySelector(".modal-close")
    .addEventListener("click", () => pfpModal.classList.remove("show"));
  document
    .getElementById("cancel-pfp-change")
    .addEventListener("click", () => pfpModal.classList.remove("show"));
  deleteAllActivitiesBtn.addEventListener("click", deleteAllActivities);
  recentActivityList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-activity-btn");
    if (btn) {
      try {
        await db.collection("activity_log").doc(btn.dataset.id).delete();
        showToast("success", "Deleted", "Activity log removed.");
      } catch (err) {
        showToast("error", "Error", "Could not delete activity log.");
      }
    }
  });
  themeToggleBtn.addEventListener("click", () =>
    setTheme(
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark"
    )
  );
  darkModeToggle.addEventListener("change", (e) =>
    setTheme(e.target.checked ? "dark" : "light")
  );
  document
    .getElementById("clear-cache-btn")
    .addEventListener("click", () =>
      showToast("success", "Cache Cleared", "Simulated clearing of local data.")
    );
  document
    .getElementById("settings-logout-btn")
    .addEventListener("click", () => auth.signOut());
  backupBtn.addEventListener("click", backupData);
  restoreBtn.addEventListener("click", () => restoreFileInput.click());
  restoreFileInput.addEventListener("change", restoreData);

  mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.add("show");
    sidebarOverlay.classList.add("show");
  });

  sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("show");
    sidebarOverlay.classList.remove("show");
  });
});
