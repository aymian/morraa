import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBpZ5YXe-_PKvSPsdoU5ffjRal8fnV6_VA",
    authDomain: "mora-4b89d.firebaseapp.com",
    projectId: "mora-4b89d",
    storageBucket: "mora-4b89d.firebasestorage.app",
    messagingSenderId: "758534233604",
    appId: "1:758534233604:web:b66a44293cdfc844525f51"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUsers() {
    console.log("Checking users...");
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        console.log(`Found ${snapshot.size} users.`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}, Username: ${data.username}, FullName: ${data.fullName}`);
        });
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

checkUsers();
