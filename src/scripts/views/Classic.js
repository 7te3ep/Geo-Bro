export class Classic {
   constructor(server, authUser, router) {
      this.lobbyID;
      this.layer = 3;
      this.getEl = (id) => document.getElementById(id);
      this.elements = {};
      this.link = "/classic";
      this.path = "views/classic.html";
      this.server = server;
      this.authUser = authUser;
      this.isHost = false;
      this.router = router;
      this.countries = [];
      this.gameParam;
      this.gameState = "idling";
      this.round = 0;
      this.score = 0;
      this.streak = 0;
      this.time 
      this.timer = "";
      this.map = "world.geojson";
      this.gameEndTimer;
      this.replay = false
      this.startTime
   }

   async init() {
      await this.router.loadPage(this.link, this.path);
      document.querySelectorAll(".scoreBoard").forEach((el) => (el.style.display = "none"));
      this.getEl("content").style.paddingTop = "2vh";
      this.elements["display"] = this.getEl("display");
      this.elements["playerList"] = this.getEl("playerList");
      this.elements["score"] = this.getEl("score");
      this.elements["streak"] = this.getEl("streak");
      this.elements["first"] = this.getEl("first");
      this.elements["second"] = this.getEl("second");
      this.elements["third"] = this.getEl("third");
      this.elements["skipButton"] = this.getEl("skipButton");
      this.elements["timeDisplay"] = this.getEl("timeDisplay");
      this.elements["replay"] = this.getEl("replay");
      this.elements["joinLobbyBtn"] = this.getEl("joinLobbyBtn");
      await this.hostTryConnectToLobby();
      if (!this.isHost) await this.findLobby();
      if (this.isHost) await this.server.removeData(`replayStack/${this.authUser.uid}`)

      await this.server.setData(`users/${this.authUser.uid}/tuto`,false)

      this.gameParam = await this.server.getData(
         `lobbys/${this.lobbyID}/param`
      );
      this.time = this.gameParam.time
      this.elements.timeDisplay.innerHTML = this.time + " 🕒";
      if (this.gameParam.map == "us") this.map = "us-states_optimized.geojson";
      if (this.gameParam.map == "fr")this.map = "french-departments_optimized.geojson";
      if (this.gameParam.map == "world")this.map = "world-countries_optimized.geojson";
      this.initMap();

      await this.server.exeOnChange(`lobbys/${this.lobbyID}`, () => {
         return this.updateOnValue();
      });

      if (this.isHost) {
         await this.generateGameData();
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
         this.eventAppear("skipped");
         this.nextTurn(true);
      });
      await this.server.onDisconnectRemove(`lobbys/${this.lobbyID}`)
      await this.server.onDisconnectRemove(`hosts/${this.authUser.uid}`)
      await this.server.onDisconnectRemove(`replayStack/${this.authUser.uid}`)
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
         if (gameData.game.state == "ended") await this.endGame();
      }
     
      if (this.countries.length - 1 == this.round)
         await this.upadteScoreBoard();
   }

   async startGame() {
      this.gameState = "playing"
      if (this.isHost) this.gameEndTimer = setTimeout(async () =>{
         const serverStillExist = await this.server.getData(`lobbys/${this.lobbyID}`) 
         if (!serverStillExist) return
         await this.server.setData(`lobbys/${this.lobbyID}/game/state`,"ended")
      } ,this.gameParam.time * 1000 +1000);
      clearInterval(this.timer);
      this.timer = setInterval(async () => {
         this.time -= 1;
         this.elements.timeDisplay.innerHTML = this.time + " 🕒";
         if (this.time <= this.gameParam.time / 4 && this.time <= 15) {
            document.querySelectorAll(".game").forEach((el)=>el.classList.add("shake"))
            document.querySelector('body').classList.add('redBorders')
            setTimeout(() => {document.querySelector('body').classList.remove('redBorders')},500)
         }
      }, 1000);

      if (this.time <= 0) clearInterval(this.timer);

      const gameData = await this.server.getData(`lobbys/${this.lobbyID}/game`);
      this.countries = gameData.countries;
      this.elements.display.innerHTML = this.countries[this.round];
      this.startTime = new Date()
   }

   async endGame() {
      this.gameState = "ended"
      clearInterval(this.timer);
      document.querySelectorAll(".game").forEach((el)=>el.classList.remove("shake"))
      document.querySelector('body').classList.remove('redBorders')
      document.querySelector("svg").style.display = "none";
      document
         .querySelectorAll(".game")
         .forEach((el) => (el.style.display = "none"));
      document.querySelectorAll(".scoreBoard").forEach((el) => {
         el.style.display = "flex";
      });
      if (!this.isHost) this.elements.replay.style.display = "none";
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
      this.startTime = new Date()
      if (this.countries.length == this.round + 1) return this.endGame();
      if (!skip) this.score += 1 + this.streak;
      else if (this.streak != 0) this.streak -= 1;
      this.round += 1;
      if (this.streak < 3 && !skip) this.streak += 1;
      this.elements.streak.innerHTML =
         "🔥".repeat(this.streak) + "⚫".repeat(3 - this.streak);
      this.elements.display.innerHTML = this.countries[this.round];
      this.elements.score.innerHTML = this.score + "pt";
      await this.server.setData(
         `lobbys/${this.lobbyID}/players/${this.authUser.uid}/score`,
         this.score
      );
   }

   async generateGameData() {
      let countriesData = await (await fetch(`../assets/${this.map}`)).json();
      countriesData = countriesData.features.map(
         (countrie) => countrie.properties.name
      );
      let pickedCoutries = [];
      for (let i = 0; i < this.gameParam.len; i++) {
         const randomIndexInArray = Math.round(
            Math.random() * (countriesData.length - 1)
         );
         pickedCoutries.push(countriesData[randomIndexInArray]);
         countriesData.splice(randomIndexInArray, 1);
      }
      await this.server.setData(
         `lobbys/${this.lobbyID}/game/countries`,
         pickedCoutries
      );
      await this.server.setData(`lobbys/${this.lobbyID}/game/state`, "playing");
   }

   async pathClicked(e, element) {
      if (this.countries[this.round] ==  this.server.decrypt(element.id,this.lobbyID)) {
         d3.select(element).style("fill", "rgb(95, 173, 65)");
         this.eventAppear("valid");
         await this.server.setData(`jefaisdesstat/${new Date()}`, this.startTime - new Date())
         return this.nextTurn(false);
      } else {
         d3.select(element).style("fill", "rgb(188, 59, 57)");
      }

      this.eventAppear("invalid");
      this.streak = 0;
      this.elements.streak.innerHTML =
         "🔥".repeat(this.streak) + "⚫".repeat(3 - this.streak);
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
      clearInterval(this.timer);
      clearInterval(this.gameEndTimer);
      this.getEl("content").style.paddingTop = "10vh";
      if (this.isHost) {
         this.isHost = false;
         await this.server.removeData(`replayStack/${this.authUser.uid}`)
         this.server.stopExeOnChange(`lobbys/${this.lobbyID}`);
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
