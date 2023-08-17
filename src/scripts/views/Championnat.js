export class Championnat {
   constructor(server, authUser, router) {
      this.lobbyID;
      this.layer = 3;
      this.getEl = (id) => document.getElementById(id);
      this.elements = {};
      this.link = "/championnat";
      this.path = "views/championnat.html";
      this.server = server;
      this.authUser = authUser;
      this.isHost = false;
      this.router = router;
      this.countries = [];
      this.gameParam;
      this.gameState = "idling";
      this.map = "world.geojson";
      this.replay = false
      this.round = 0
   }

   async init() {
      await this.router.loadPage(this.link, this.path);
      document.querySelectorAll(".scoreBoard").forEach((el) => (el.style.display = "none"));
      this.getEl("content").style.paddingTop = "2vh";
      this.elements["display"] = this.getEl("display");
      this.elements["playerList"] = this.getEl("playerList");
      this.elements["score"] = this.getEl("score");
      this.elements["skipButton"] = this.getEl("skipButton");
      this.elements["replay"] = this.getEl("replay");
      this.elements["joinLobbyBtn"] = this.getEl("joinLobbyBtn");
      this.elements["startRound"] = this.getEl("startRound");
      this.elements["nextRound"] = this.getEl("nextRound");
      await this.hostTryConnectToLobby();
      if (!this.isHost) await this.findLobby();

      if (this.isHost) await this.server.removeData(`replayStack/${this.authUser.uid}`)
      await this.server.setData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}/status`,"alive");

      this.gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`);
      if (this.gameParam.map == "us") this.map = "us-states_optimized.geojson";
      if (this.gameParam.map == "fr")this.map = "french-departments_optimized.geojson";
      if (this.gameParam.map == "world")this.map = "world-countries_optimized.geojson";

      await this.server.exeOnChange(`lobbys/${this.lobbyID}`, () => {
         return this.updateOnValue();
      });

      if (this.isHost) {
         this.elements.startRound.addEventListener('click',async ()=>{
            await this.server.setData(`lobbys/${this.lobbyID}/game/state`,"beforeRound")
            this.elements.startRound.style.display = "none"

         })
         await this.generateGameData();
         await this.server.onDisconnectRemove(`lobbys/${this.lobbyID}`)
         await this.server.onDisconnectRemove(`hosts/${this.authUser.uid}`)
         await this.server.onDisconnectRemove(`replayStack/${this.authUser.uid}`)
      }
      var canConnect = true
      this.elements.replay.addEventListener('click',async (event)=>{
         await this.server.setData(`replayStack/${this.authUser.uid}`,{
            param:this.gameParam,
            players: await this.server.getData(`lobbys/${this.lobbyID}/players`),
         })
         this.replay = true
         this.elements.replay.href = "/chooseGameMode"
         if (canConnect) this.elements.replay.click()
         canConnect = false
      })

      await this.initMap();
      document.getElementById('map').style.display = "none"
   }

   async eventAppear(id) {
      document.getElementById(id).classList.remove("emojiGoOut");
      document.getElementById(id).classList.add("emojiEnter");
      setTimeout(() => {
         document.getElementById(id).classList.remove("emojiEnter");
         document.getElementById(id).classList.add("emojiGoOut");
      }, 500);
   }

   async updateOnValue() {
      const gameData = await this.server.getData(`lobbys/${this.lobbyID}`);
      this.round = gameData.game.round || 0
      await this.update()
      if (!gameData && !this.replay) {
         this.getEl("navGames").click();
         return;
      }
      if (gameData.game.state != this.gameState) {
         if (gameData.game.state == "playing") await this.startGame();
         if (gameData.game.state == "waiting") await this.updateWaiting(gameData)
         if (gameData.game.state == "beforeRound") {
            if (gameData.param.nextPlayers.find((player)=>player[0] == this.authUser.uid)){
               await this.roundStartup()
            }
         }
         this.gameState = gameData.game.state
      }
     
      if (this.gameState == "ended") await this.upadteScoreBoard();
   }

   async roundStartup(){
      document.querySelectorAll('.waiting').forEach((el)=>el.style.display = "none")
      document.querySelectorAll('.game').forEach((el)=>el.style.display = "flex")
      document.querySelectorAll('.game').forEach((el)=>el.style.display = "flex")
      document.getElementById('map').style.display = "block"
      this.elements.display.innerHTML = this.countries[this.round]
   }

   async genNextRound() {
      console.log(this.round);
      const gameData = await this.server.getData(`lobbys/${this.lobbyID}`);
      const players = Object.entries(gameData.players)
      const voeu = players.filter((player)=> player[1].team == "voeu")
      const serment = players.filter((player)=> player[1].team == "serment")
      const pacte = players.filter((player)=> player[1].team == "pacte")
      const nextPlayers = [
         voeu[this.round],
         pacte[this.round],
         serment[this.round],
      ]
      await this.server.setData(`lobbys/${this.lobbyID}/param/nextPlayers`,nextPlayers)
      await this.server.setData(`lobbys/${this.lobbyID}/game/state`, "waiting");
   }

   async updateWaiting(gameData){
      if (this.isHost) await this.genNextRound()
      
      if (document.getElementById('map')) document.getElementById('map').style.display = "none"
      document.querySelectorAll(".game").forEach((el) => (el.style.display = "none"));
      document.querySelectorAll(".waiting").forEach((el) => (el.style.display = "flex"));
      if (this.isHost)this.elements.startRound.style.display = "flex"
      const nextPlayers = gameData.param.nextPlayers
      if (!nextPlayers) return
      this.elements.nextRound.innerHTML = ""
      nextPlayers.forEach((player)=>{
         this.elements.nextRound.innerHTML += `<div class="card electricBlue rounded row"><div class="row"><img alt="profile image of user" class="userImg" src="${player[1].img}"><p>${player[1].name}</p></div>${player[1].team}</div>`
      })
   }

   async startGame() {
      this.countries = await this.server.getData(`lobbys/${this.lobbyID}/game/countries`)
      if (!this.isHost) this.elements.startRound.style.display = "none"
      else {
         await this.genNextRound()
      }
   }

   async endGame() {
      await this.server.setData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}/score`,this.score);
      await this.server.setData(`lobbys/${this.lobbyID}/game/state`,"ended")
      this.gameState = "ended"
      document.querySelectorAll(".game").forEach((el)=>el.classList.remove("shake"))
      document.querySelector('body').classList.remove('redBorders')
      document.querySelector("svg").style.display = "none";
      document.querySelectorAll(".game").forEach((el) => (el.style.display = "none"));
      document.querySelectorAll(".scoreBoard").forEach((el) => {el.style.display = "flex"});
      this.elements.replay.style.display = "none"

      await this.server.setData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}/status`,"died");
      await this.upadteScoreBoard();
   }

   async upadteScoreBoard() {
      var players = Object.values(
         await this.server.getData(`lobbys/${this.lobbyID}/players`)
      );
      players = players.sort((a, b) => b.score - a.score);
      this.elements.playerList.innerHTML = "";
      players.forEach((player) => {
         const playerToShow = `<div class="card rounded light row"><span id="playerName">${
            player.name
         }</span><span id="playerScore">Score : ${
            player.score ? player.score : 0
         }</span></div>`;
         this.elements.playerList.innerHTML += playerToShow;
      });
   }

   async generateGameData() {
      let countriesData = await (await fetch(`../assets/${this.map}`)).json();
      countriesData = countriesData.features
      .map((countrie) => countrie.properties.name)
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      await this.server.setData(`lobbys/${this.lobbyID}/game/countries`,countriesData);
      await this.server.setData(`lobbys/${this.lobbyID}/game/state`, "playing");
   }

   async pathClicked(e, element) {
      if (this.countries[this.round] ==  this.server.decrypt(element.id,this.lobbyID)) {
         d3.select(element).style("fill", "rgb(95, 173, 65)");
         this.eventAppear("valid");
         await this.server.setData(`lobbys/${this.lobbyID}/game/state`,"waiting")
         const playerFaction = await this.server.getData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}/team`)
         const currentFactionScore = await this.server.getData(`lobbys/${this.lobbyID}/game/${playerFaction}`) || 0
         await this.server.setData(`lobbys/${this.lobbyID}/game/${playerFaction}`,currentFactionScore + 1)
         await this.server.setData(`lobbys/${this.lobbyID}/game/state`,"waiting")
         const currentRound = await this.server.getData(`lobbys/${this.lobbyID}/game/round`)
         await this.server.setData(`lobbys/${this.lobbyID}/game/round`,currentRound + 1)
         return 
      }
      d3.select(element).style("fill", "rgb(188, 59, 57)");
      this.eventAppear("invalid");
   }

   async hostTryConnectToLobby() {
      const hostDataPath = `hosts/${this.authUser.uid}`;
      const hostData = await this.server.getData(hostDataPath);
      if (!hostData) return;
      this.isHost = true;
      this.lobbyID = hostData.id;
      await this.server.setData(`lobbys/${this.lobbyID}/game/started`, true);
   }

   async findLobby() {
      const lobbys = Object.entries(await this.server.getData("lobbys"));
      for (let lobby of lobbys) {
         const lobbyID = lobby[0];
         const lobbyPlayers = Object.entries(lobby[1].players || {});
         for (let player of lobbyPlayers) {
            const isUserLobby = player[0] == this.authUser.uid;
            if (isUserLobby) this.lobbyID = lobbyID;
         }
      }
   }

   async deletePlayerOfLobby(playerUid) {
      let playersOnLobby = await this.server.getData(
         `lobbys/${this.lobbyID}/players`
      );
      if (!playersOnLobby) return;
      delete playersOnLobby[playerUid];
      this.server.setData(`lobbys/${this.lobbyID}/players`, playersOnLobby);
   }

   async update() {
      const scoreVoeu = await this.server.getData(`lobbys/${this.lobbyID}/game/voeu`) || 0
      const scorePacte = await this.server.getData(`lobbys/${this.lobbyID}/game/pacte`) || 0
      const scoreSerment = await this.server.getData(`lobbys/${this.lobbyID}/game/serment`) || 0
      document.getElementById('voeu').innerHTML = `voeu : ${scoreVoeu}` 
      document.getElementById('pacte').innerHTML = `pacte : ${scorePacte}` 
      document.getElementById('serment').innerHTML = `serment : ${scoreSerment}` 
   }

   async swipeNav(diretion) {}

   async quit() {
      clearInterval(this.speedTimer)
      clearInterval(this.gameTimer)
      this.getEl("content").style.paddingTop = "10vh";
      if (this.isHost) {
         this.isHost = false;
         await this.server.stopExeOnChange(`lobbys/${this.lobbyID}`);
         await this.server.removeData(`replayStack/${this.authUser.uid}`)
         await this.server.removeData(`lobbys/${this.lobbyID}`)
         await this.server.removeData(`hosts/${this.authUser.uid}`)
      } else {
         await this.server.stopExeOnChange(`lobbys/${this.lobbyID}`);
         await this.deletePlayerOfLobby(this.authUser.uid);
      }
   }

   async initMap() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const projection = d3
         .geoMercator()
         .translate([width / 2, height / 2])
         .fitSize([width, height], await d3.json(`../assets/${this.map}`));

      const path = d3.geoPath().projection(projection);

      const zoom = d3
         .zoom()
         .scaleExtent([1, 18])
         .translateExtent([
            [0, 0],
            [width, height],
         ])
         .on("zoom", () => g.attr("transform", d3.event.transform));

      const svg = d3
         .select("#content")
         .append("svg")
         .attr("width", `100%`)
         .attr("id", `map`)
         .attr("height", `100%`);

      const g = svg.append("g");
      const classThis = this;
      d3.json(`../assets/${this.map}`).then((world) => {
         g.selectAll(".country")
            .data(world.features)
            .enter()
            .append("path")
            .attr("id", (d) => this.server.crypt(d.properties.name,this.lobbyID))
            .attr("class", "country")
            .attr("stroke", "black")
            .attr("stroke-width", "0.1px")
            .attr("d", path)
            .style("fill", "rgb(255, 255, 209)")
            .on("click", function (e) {
               g.selectAll(".country").style("fill", "rgb(255, 255, 209)");
               classThis.pathClicked(e, this);
            });
      });
      d3.select("svg").on("dblclick.zoom", null);
      svg.call(zoom);
      d3.select("svg").on("dblclick.zoom", null);
   }
}
