import { Classic } from "./views/Classic.js";
import { DashBoard } from "./views/DashBoard.js";
import { Games } from "./views/Games.js";
import { Social } from "./views/Social.js";
import { Lobby } from "./views/Lobby.js";
import { HostLobby } from "./views/HostLobby.js";
import { NotFound } from "./views/NotFound.js";
import { Entry } from "./views/Entry.js";
import { chooseGameMode } from "./views/chooseGameMode.js";
import { Speedrun } from "./views/Speedrun.js";
import { Parameters } from "./views/Parameters.js";
import { ChooseMap } from "./views/chooseMap.js";

let route = {
   "/dashboard": DashBoard,
   "/games": Games,
   "/social": Social,
   "/classic": Classic,
   "/hostLobby": HostLobby,
   "/lobby": Lobby,
   "/404":NotFound,
   "/entry":Entry,
   "/chooseGameMode":chooseGameMode,
   "/speedrun":Speedrun,
   "/parameters":Parameters,
   "/chooseMap":ChooseMap
};

export { route }