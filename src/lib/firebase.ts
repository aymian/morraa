// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpZ5YXe-_PKvSPsdoU5ffjRal8fnV6_VA",
  authDomain: "mora-4b89d.firebaseapp.com",
  databaseURL: "https://mora-4b89d-default-rtdb.firebaseio.com",
  projectId: "mora-4b89d",
  storageBucket: "mora-4b89d.firebasestorage.app",
  messagingSenderId: "758534233604",
  appId: "1:758534233604:web:b66a44293cdfc844525f51",
  measurementId: "G-8YLCRE5T9X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
