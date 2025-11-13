// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBvkO-Lj1dPgf3UCeXW7jsMDMKAFkB_-Gw",
  authDomain: "pathx-7a636.firebaseapp.com",
  projectId: "pathx-7a636",
  storageBucket: "pathx-7a636.appspot.com",
  messagingSenderId: "756222390109",
  appId: "1:756222390109:web:4a2914cdc12767cb1d42b4",
  measurementId: "G-QPZ5QP71CF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

isSupported().then((supported) => {
  if (supported) {
    const analytics = getAnalytics(app);
    console.log("📊 Analytics initialized");
  } else {
    console.log("⚠️ Analytics not supported in this environment");
  }
});

console.log("✅ Firebase initialized:", app.name);

// ✅ Export named exports
export { app, db, auth, firebaseConfig, storage };
