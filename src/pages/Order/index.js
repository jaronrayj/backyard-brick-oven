import React from "react";
import { Helmet } from "react-helmet-async";

const Order = () => {
  return (
    <div className="register">
      <Helmet>
        <title>Order Pizza | Backyard Brick Oven — Bountiful, Utah</title>
        <meta
          name="description"
          content="Order Neapolitan-style brick oven pizza from Backyard Brick Oven for Pizza Friday in Bountiful, Utah."
        />
        <link rel="canonical" href="https://backyard-brickoven.web.app/order" />
      </Helmet>
    </div>
  );
};
export default Order;
