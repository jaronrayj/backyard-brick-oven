import brickyard from "./assets/PXL_20220308_064811105.MP.jpg";
import "./App.css";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  // The value of `databaseURL` depends on the location of the database
  databaseURL: "https://DATABASE_NAME.firebaseio.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
  // For Firebase JavaScript SDK v7.20.0 and later, `measurementId` is an optional field
  measurementId: "G-MEASUREMENT_ID",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

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
