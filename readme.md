# 📚 ComixAll — A Modern Comic Reading Platform

**ComixAll** is a sleek and fully responsive comic reading website crafted with love and dedication by **Avdesh Jadon**.  
It allows users to explore, read, and manage digital comics in a simple yet powerful way — built for readers, by a reader.

> 💡 *Designed & Developed entirely by Avdesh Jadon — a passionate full-stack developer from Agra, India.*

---

## 🔗 Live Demo

👉 [Explore ComixAll Live](https://avdeshjadon-dev.github.io/ComixAll/)

---

## ✨ Features

- 📂 Folder-based comic structure (main comic → chapters → images)
- 📖 Seamless vertical reader optimized for desktop and mobile
- 🏷️ Category filtering for easier browsing
- 🔒 Admin panel with comic upload, part renaming, thumbnail generation
- ☁️ Firebase + Cloudinary integration
- ⚡ Fast, clean UI built with HTML, CSS, and JavaScript
- ✅ 100% open-source and customizable

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript  
- **Hosting**: GitHub Pages  
- **Database**: Firebase Firestore  
- **Storage**: Cloudinary  
- **Auth/Upload**: Firebase Admin SDK (JS)

---

### 📁 Folder Structure

```
ComixAll/
├── admin/
│   └── index.html                 # Admin panel for comic uploads
│
├── css/
│   ├── auth.css                  # Styles for login/signup pages
│   └── style.css                 # Main website styles
│
├── js/
│   ├── auth.js                   # Login/signup logic
│   ├── firebase.js               # Firebase configuration
│   └── main.js                   # Core site functionality
│
├── .gitignore                    # Ignore node_modules or credentials
├── comic.html                    # Comic listing per folder
├── index.html                    # Home page (categories, popular, etc.)
├── login.html                    # Login page
├── reader.html                   # Comic reading UI (vertical scroll)
├── signup.html                   # Signup/registration page
└── README.md                     # Project info by Avdesh Jadon
```
---

## 🚀 Local Setup by Avdesh Jadon

To run the project on your local machine:

```bash
git clone https://github.com/avdeshjadon-dev/ComixAll.git
cd ComixAll
open index.html  # or use Live Server extension in VSCode
```
