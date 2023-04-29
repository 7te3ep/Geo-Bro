import { Gbro } from "./scripts/Gbro.js";
import { Server } from "./scripts/Server.js";

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
   loader,
   ui
);

geoBro.init()
      
      