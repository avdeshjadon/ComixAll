firebase.initializeApp({
  apiKey: "AIzaSyCwkRk12HxQlQS2DH12lcolRNvF2ALprZM",
  authDomain: "comix-9be69.firebaseapp.com",
  projectId: "comix-9be69",
  storageBucket: "comix-9be69.appspot.com",
  messagingSenderId: "346083786632",
  appId: "1:346083786632:web:f95c8c3dacafe47f23843d",
  measurementId: "G-JKP6BL997B",
});

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

db.enablePersistence().catch((err) => {
  console.log("Persistence error:", err);
});

window.firebaseApp = { app, auth, db, storage };
