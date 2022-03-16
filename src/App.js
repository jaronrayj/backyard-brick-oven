import brickyard from "./assets/PXL_20220308_064811105.MP.jpg";
import "./App.css";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseApp = initializeApp({
  apiKey: "AIzaSyB0Db6k61cOIzvwuQ_LHdJhL_XdUTkg0Ww",
  authDomain: "backyard-brickoven.firebaseapp.com",
  projectId: "backyard-brickoven",
  storageBucket: "backyard-brickoven.appspot.com",
  messagingSenderId: "617331177853",
  appId: "1:617331177853:web:b1a726a44ad1a3654ff414",
  measurementId: "G-RB0DB3R1SY",
});

// Initialize Firebase

const analytics = getAnalytics(firebaseApp);
console.log("🚀 ~ file: App.js ~ line 28 ~ analytics", analytics);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const ordersCol = collection(db, "orders");
console.log("🚀 ~ file: App.js ~ line 32 ~ ordersCol", ordersCol);

onAuthStateChanged(auth, (user) => {
  if (user !== null) {
    console.log("logged in!");
  } else {
    console.log("no user");
  }
});

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={brickyard} className="App-logo" alt="jaron" />
        <h2>Welcome</h2>
        <h1>Future site of Jaron's Backyard Brick Oven</h1>
        <p>Give us some time while we do some building!</p>
      </header>
    </div>
  );
}

export default App;
