import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import "./Menu.css";
import { auth, db, logout } from "../../utils/firebase";
import { query, collection, getDocs, where } from "firebase/firestore";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";

const Menu = () => {
  const [user, loading, error] = useAuthState(auth);
  const [name, setName] = useState("");
  const fetchUserName = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const data = doc.docs[0].data();
      setName(data.name);
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };
  useEffect(() => {
    if (loading) return;
    if (!user) return "login";
    fetchUserName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);
  return (
    <Navbar>
      <Container>
        <Navbar.Brand href="#home">Navbar with text</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text> Signed in as: {name}</Navbar.Text>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    // <div className="menu-container">
    //   {user ? (
    //     <menu className="menu">
    //       <li>{name}</li>
    //       {/* <div>{user?.email}</div> */}
    //       <li className="logout__btn" onClick={logout}>
    //         Logout
    //       </li>
    //     </menu>
    //   ) : (
    //     <button>Login</button>
    //   )}
    // </div>
  );
};
export default Menu;
