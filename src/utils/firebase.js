// Import the functions you need from the SDKs you need
import { initializeApp} from "firebase/app";
import { getDatabase } from "firebase/database";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyB0Db6k61cOIzvwuQ_LHdJhL_XdUTkg0Ww",
  authDomain: "backyard-brickoven.firebaseapp.com",
  projectId: "backyard-brickoven",
  storageBucket: "backyard-brickoven.appspot.com",
  messagingSenderId: "617331177853",
  appId: "1:617331177853:web:b1a726a44ad1a3654ff414",
  measurementId: "G-RB0DB3R1SY",
  databaseURL: "https://backyard-brickoven-default-rtdb.firebaseio.com/",
};

// const analytics = getAnalytics(firebaseApp);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Team sign-in is Google only. Who can do what is the team list (useTeamRole).
const googleProvider = new GoogleAuthProvider();
const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error(err);
    const quiet = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];
    if (err && err.code && !quiet.includes(err.code)) {
      window.alert(`Sign-in didn't work (${err.code}). Send this message to Jaron.`);
    }
  }
};

const logout = () => {
  signOut(auth);
};

export { auth, db, rtdb, signInWithGoogle, logout };
