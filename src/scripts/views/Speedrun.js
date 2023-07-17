export class Speedrun {
   constructor(server, authUser, router) {
      this.lobbyID;
      this.layer = 3;
      this.getEl = (id) => document.getElementById(id);
      this.elements = {};
      this.link = "/speedrun";
      this.path = "views/speedrun.html";
      this.server = server;
      this.authUser = authUser;
      this.isHost = false;
      this.router = router;
      this.countries = [];
      this.gameParam;
      this.gameState = "idling";
      this.round = 0;
      this.score = 0;
      this.map = "world.geojson";
      this.replay = false
      this.speed = 100
      this.speedTimer
      this.gameTimer
      this.speedSubPerSec = 3
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
      this.elements["rocket"] = this.getEl("rocket");
      this.elements["speedJauge"] = this.getEl("speedJauge");
      await this.hostTryConnectToLobby();
      if (!this.isHost) await this.findLobby();
      if (this.isHost) await this.server.removeData(`replayStack/${this.authUser.uid}`)
      await this.server.setData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}/status`,"alive");

      this.gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`);
      if (this.gameParam.map == "us") this.map = "us-states_optimized.geojson";
      if (this.gameParam.map == "fr")this.map = "french-departments_optimized.geojson";
      if (this.gameParam.map == "world")this.map = "world-countries_optimized.geojson";
      this.initMap();

      await this.server.exeOnChange(`lobbys/${this.lobbyID}`, () => {
         return this.updateOnValue();
      });

      if (this.isHost) {
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

      this.elements.skipButton.addEventListener("click", () => {
         this.speed -= 5
         this.updateRocket()
         this.eventAppear("skipped");
         this.nextTurn(true);
      });

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
      if (!gameData && !this.replay) {
         this.getEl("navGames").click();
         return;
      }
      if (gameData.game.state != this.gameState) {
         if (gameData.game.state == "playing") await this.startGame();
      }
     
      if (this.gameState == "ended") await this.upadteScoreBoard();
      if (this.isHost) {
         const players = Object.values(await this.server.getData(`lobbys/${this.lobbyID}/players`))
         const diedPlayers = players.filter((player)=> player.status == "died")
         console.log(diedPlayers.length , players.length);
         if (diedPlayers.length != players.length) return
         const serverStillExist = await this.server.getData(`lobbys/${this.lobbyID}`) 
         if (!serverStillExist) return
         console.log("AAAAAAAAAAAAAAAAAAAAAAA", this.elements.replay)
         await this.server.setData(`lobbys/${this.lobbyID}/game/state`,"ended")
         this.elements.replay.style.display = "flex";
      }

   }

   async startGame() {
      this.gameState = "playing"

      const gameData = await this.server.getData(`lobbys/${this.lobbyID}/game`);
      this.countries = gameData.countries;
      this.elements.display.innerHTML = this.countries[this.round];

      this.gameTimer = setInterval(()=>{
         this.speedSubPerSec = Math.ceil(this.speedSubPerSec * 1.1)
      },10000)

      console.log(this.speed);
      this.speedTimer = setInterval(async ()=>{
         this.speed -= this.speedSubPerSec
         this.updateRocket()
         this.score ++
         if (this.speed <= 0) await this.endGame()
      },1000)
   }

   async updateRocket() {
      if (this.speed >= 100) this.speed = 100
      if (this.speed <= 0) this.speed = 0

      this.elements.rocket.style.top = `${93-this.speed}%`
      this.elements.speedJauge.style.height = `${this.speed}%`
   }

   async endGame() {
      console.trace()
      await this.server.setData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}/score`,this.score);
      await this.server.setData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}/status`,"died");
      this.gameState = "ended"
      clearInterval(this.speedTimer)
      clearInterval(this.gameTimer)

      const name = await this.server.getData(`users/${this.authUser.uid}/data/name`)
      let leaderBoard = Object.entries(await this.server.getData("leaderboard") || {})
      let data = {}
      data[name] = this.score
      leaderBoard.push(["test",data])
      leaderBoard = leaderBoard.map((player)=>Object.values(player))
      leaderBoard = leaderBoard.sort((a,b)=>Object.entries(b[1])[0][1]-Object.entries(a[1])[0][1])
      if (leaderBoard.length > 10) leaderBoard.splice(leaderBoard.length-1,1)
      leaderBoard = leaderBoard.map((player)=>player[1])
      await this.server.setData('leaderboard',leaderBoard)

      document.querySelectorAll(".game").forEach((el)=>el.classList.remove("shake"))
      document.querySelector('body').classList.remove('redBorders')
      document.querySelector("svg").style.display = "none";
      document.querySelectorAll(".game").forEach((el) => (el.style.display = "none"));
      document.querySelectorAll(".scoreBoard").forEach((el) => {el.style.display = "flex"});
      this.elements.replay.style.display = "none"
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

   async nextTurn(skip) {
      if (this.countries.length == this.round + 1) return this.endGame();
      this.round += 1;
      this.elements.display.innerHTML = this.countries[this.round];
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
      if (this.round == this.countries.length -1) this.round = 0

      if (this.countries[this.round] ==  this.server.decrypt(element.id,this.lobbyID)) {
         this.speed += 20
         this.updateRocket()
         d3.select(element).style("fill", "rgb(95, 173, 65)");
         this.eventAppear("valid");
         return this.nextTurn(false);
      } else {
         this.speed -= 10
         this.updateRocket()
         d3.select(element).style("fill", "rgb(188, 59, 57)");
      }

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

   async update() {}

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
