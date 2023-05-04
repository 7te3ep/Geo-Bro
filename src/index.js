import { Gbro } from "./scripts/Gbro.js";
import { Router } from "./scripts/modules/Router.js";
import { Server } from "./scripts/modules/Server.js";
import {DashBoard , Games , Social , Lobby , HostLobby, CountryGame } from "./scripts/View.js"

let route = {
   "/dashboard": DashBoard,
   "/games": Games,
   "/social": Social,
   "/country": CountryGame,
   "/hostLobby": HostLobby,
   "/lobby": Lobby,
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

