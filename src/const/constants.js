export const defaultPizza = {
  id: "fsfds1231221das",
  name: "Select a pizza",
  toppings: [],
  price: 7,
  sliced: true,
  customizable: false,
  img: "https://via.placeholder.com/150x150",
};

export const defaultUserOrder = {
  pizzaIds: [],
  timeOrdered: 1,
  expectedPickupTime: 2,
  paid: false,
  readyForOrder: false,
  userId: "uid",
  active: true,
};

export const defaultPizzaSession = {
  date: "Fri Apr 22 2022",
  doughQuantity: 17,
  beginningTime: "17:00:00",
  endingTime: "19:00:00",
  pizzasAvailable: [],
};

export const defaultUser = {
  uid: "uid",
  name: "anonymous",
  authProvider: "local",
  email: "test@test.com",
  role: "client",
};
