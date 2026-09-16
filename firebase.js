import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDtabM11H19VclSMxwage4ZDXxKTvgsvu4",
  authDomain: "book-sahayak.firebaseapp.com",
  projectId: "book-sahayak",
  storageBucket: "book-sahayak.firebasestorage.app",
  messagingSenderId: "758198853938",
  appId: "1:758198853938:web:39da7e56484944c9b1372b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);