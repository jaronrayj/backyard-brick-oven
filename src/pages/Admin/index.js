import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../utils/firebase_auth";
import { collection, query, where, addDoc, getDocs } from "firebase/firestore";

const Admin = () => {
  const [user, loading, error] = useAuthState(auth);
  const [dbUser, setDbUser] = useState();
  const navigate = useNavigate();

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
  return <div className="register"></div>;
};
export default Admin;
