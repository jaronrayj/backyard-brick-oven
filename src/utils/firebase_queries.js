import {
  getFirestore,
  collection,
  query,
  where,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { defaultPizza } from "../const/constants";
import { db } from "./firebase";

export const getOrderHistory = async (user) => {
  try {
    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const docs = await getDocs(q);
    if (docs.docs.length === 0) {
      return;
    } else {
      return docs;
    }
  } catch (err) {
    console.log(err);
  }
};

export const createPizza = async (pizza) => {
  try {
    await addDoc(collection(db, "pizzas"), pizza);
  } catch (err) {
    console.log(err);
  }
};

export const fetchPizza = async (pizza) => {
  try {
    const q = query(collection(db, "pizzas"), where("uid", "==", pizza.uid));
    const docs = await getDocs(q);
    if (docs.docs.length === 0) {
      return;
    } else {
      return docs.docs[0].data();
    }
  } catch (err) {
    console.log(err);
  }
};

export const fetchAllPizzas = async () => {
  try {
    const q = query(collection(db, "pizzas"));
    const docs = await getDocs(q);
    const pizzaArr = [];
    docs.docs.forEach((pizza) => {
      const newObj = pizza.data();
      newObj.id = pizza.id;
      pizzaArr.push(newObj);
    });
    return pizzaArr;
  } catch (err) {
    console.log(err);
  }
};

// todo to build out
// export const modifyPizza = async (pizza) => {
//   try {
//     await addDoc(collection(db, "pizzas"), {
//       name: pizza.name,
//       toppings: pizza.toppings,
//       price: pizza.price,
//       sliced: true,
//       customizable: pizza.customizable,
//       img: pizza.img,
//     });
//   } catch (err) {
//     console.log(err);
//   }
// };
