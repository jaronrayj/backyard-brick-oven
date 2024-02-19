// Import the functions you need from the SDKs you need
import { initializeApp} from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
// import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { defaultUser } from "../const/constants";

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

const googleProvider = new GoogleAuthProvider();
const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const docs = await getDocs(q);
    if (docs.docs.length === 0) {
      const newUser = defaultUser;
      newUser.email = user.email;
      newUser.name = user.displayName;
      newUser.uid = user.uid;
      newUser.authProvider = "google";
      await addDoc(collection(db, "users"), newUser);
    }
  } catch (err) {
    console.error(err);
  }
};

const logInWithEmailAndPassword = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    // todo make all of these NOT alerts
    alert(err.message);
  }
};

const registerWithEmailAndPassword = async (name, email, password) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    const newUser = defaultUser;
    newUser.email = email;
    newUser.name = name;
    newUser.uid = user.uid;
    await addDoc(collection(db, "users"), newUser);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset link sent!");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

const logout = () => {
  signOut(auth);
};

export {
  auth,
  db,
  rtdb,
  signInWithGoogle,
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
  sendPasswordReset,
  logout,
};
