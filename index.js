import { Gbro } from "./scripts/Gbro.js";
import { Router } from "./scripts/Router.js";
import { Server } from "./scripts/Server.js";

const routes = {
   404: "views/404.html",
   "/dashboard": "views/dashboard.html",
   "/games": "views/games.html",
   "/home": "views/home.html",
};

const ui = {
   userName: document.getElementById("userName"),
   userImg: document.getElementById("userImg"),
   userCoins: document.getElementById("userCoin")
};

const loader = (visibility) =>
   (document.querySelector(".loader").style.display = visibility
      ? "flex"
      : "none");

const geoBro = new Gbro(
   new Server(),
   new Router({
      contentDiv: document.getElementById("content"),
      routes,
      loader: loader,
   }),
   loader,
   ui
);

geoBro.init()

