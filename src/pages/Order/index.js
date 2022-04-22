import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../utils/firebase_auth";

const Order = () => {
  const [user, loading, error] = useAuthState(auth);

  return <div className="register"></div>;
};
export default Order;
