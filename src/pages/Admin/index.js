import React, { useEffect, useState, Fragment } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../utils/firebase_auth";
import { collection, query, where, addDoc, getDocs } from "firebase/firestore";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";
import { fetchAllPizzas } from "../../utils/firebase_queries";
import { defaultPizza } from "../../const/constants";
import capitalize from "lodash/capitalize";

const Admin = () => {
  const [user, loading, error] = useAuthState(auth);
  const [dbUser, setDbUser] = useState();
  const [pizzas, setPizzas] = useState([defaultPizza]);
  const [selected, setSelected] = useState(pizzas[0]);

  const navigate = useNavigate();
  function classNameNames(...classNamees) {
    return classNamees.filter(Boolean).join(" ");
  }

  const fetchPizzaDb = async () => {
    const pizzaDb = await fetchAllPizzas();
    setPizzas(pizzaDb);
  };

  const fetchUser = async () => {
    try {
      if (!dbUser) {
        const q = query(collection(db, "users"), where("uid", "==", user?.uid));
        const doc = await getDocs(q);
        const data = doc.docs[0].data();
        setDbUser(data);
      }
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (loading) return;
    user ? fetchUser() : navigate("/");
    if (dbUser) {
      dbUser.role !== "admin" && navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, dbUser]);

  useEffect(() => {
    if (pizzas.length === 1) {
      fetchPizzaDb();
    }
  }, [pizzas]);

  return (
    <div classNameName="max-w-md ml-3">
      <div className="relative">
        <div className="pr-10 pb-1 relative border border-gray-300 dark:border-gray-600 rounded">
          <div className="flex flex-wrap items-center">
            <div className="mt-1 ml-1 p-1 max-w-full flex items-center bg-blue-500 text-white rounded select-none cursor-text">
              <span className="text-sm truncate">facebook</span>
              <button className="pl-1 flex items-center border-0 outline-none focus:outline-none focus:ring-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="mt-1 ml-1 p-1 max-w-full flex items-center bg-blue-500 text-white rounded select-none cursor-text">
              <span className="text-sm truncate">LinkedIn</span>
              <button className="pl-1 flex items-center border-0 outline-none focus:outline-none focus:ring-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="mt-1 ml-1 overflow-hidden min-w-min flex-1">
              <input
                type="text"
                className="py-1 w-full border-0 bg-transparent outline-none focus:outline-none ring-0 focus:ring-0 appearance-none"
              ></input>
            </div>
            <button className="w-10 h-full absolute top-0 right-0 flex items-center justify-center outline-none focus:outline-none">
              <span className="transition-all duration-100 transform rotate-180">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </span>
            </button>
          </div>
          <div className="mt-2 w-full absolute to-full">
            <ul className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded shadow-lg overflow-y-auto">
              {pizzas.map((pizza) => (
                <li
                  key={pizza.id}
                  className="pl-4 pr-6 py-1 border-b border-gray-300 dark:border-gray-600 cursor-pointer truncate hover:bg-purple-100 dark:hover:bg-gray-700"
                >
                  {capitalize(pizza.name)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Admin;
