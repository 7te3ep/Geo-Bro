import { Gbro } from "./scripts/Gbro.js";
import { Router } from "./scripts/Router.js";
import { Server } from "./scripts/Server.js";
import { DashBoard, Games, Social, CountryGame } from "../scripts/View.js";

let route = {
   "/dashboard": DashBoard,
   "/games": Games,
   "/social": Social,
   "/country": CountryGame
};
const ui = {
   userName: document.getElementById("userName"),
   userImg: document.getElementById("userImg"),
   userCoins: document.getElementById("userCoin")
};

const loader = (visibility) => document.querySelector(".loader").style.display = visibility ? "flex" : "none";

const geoBro = new Gbro(
   new Server(),
   new Router({contentDiv: document.getElementById("content")},route),
   loader,
   ui,
   route
);

geoBro.init()

