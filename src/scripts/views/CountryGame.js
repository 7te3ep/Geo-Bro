export class CountryGame {
   constructor(server, authUser, router){
      this.lobbyID
      this.getEl = id => document.getElementById(id)
      this.elements = {}
      this.link = "/country"
      this.path = "views/countryGames.html"
      this.server = server
      this.authUser = authUser
      this.isHost = false
      this.router = router
      this.countries = []
      this.gameParam 
      this.gameState = "idling"
      this.round = 0
      this.score = 0
      this.streak = 0
      this.time = 100
      this.timer = ""
      this.map = "monde.geojson"
      this.gameEndTimer
      this.replay = false
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      document.querySelectorAll(".scoreBoard").forEach((el)=>el.style.display = "none")
      this.getEl("content").style.paddingTop = "2vh"
      this.elements["display"] = this.getEl("display")
      this.elements["playerList"] = this.getEl("playerList")
      this.elements["score"] = this.getEl("score")
      this.elements["streak"] = this.getEl("streak")
      this.elements["first"] = this.getEl("first")
      this.elements["second"] = this.getEl("second")
      this.elements["third"] = this.getEl("third")
      this.elements["skipButton"] = this.getEl("skipButton")
      this.elements["timeDisplay"] = this.getEl("timeDisplay")
      this.elements["replay"] = this.getEl("replay")
      this.elements["joinLobbyBtn"] = this.getEl("joinLobbyBtn")
      await this.hostTryConnectToLobby()
      if (!this.isHost) await this.findLobby()
   
      this.gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`)
      if (this.gameParam.map == "us") this.map = "us.geojson"
      this.initMap()
   
      await this.server.exeOnChange(`lobbys/${this.lobbyID}`,()=>{return this.updateOnValue()})
      if (this.isHost){
         await this.generateGameData()
      }

      this.elements.skipButton.addEventListener('click',()=>{
         this.eventAppear("skipped")
         this.nextTurn(true)
      })

      this.elements.replay.addEventListener("click",()=>{
         this.replay = true
      })
   }

   async eventAppear(id) {
      document.getElementById(id).classList.remove("emojiGoOut")
      document.getElementById(id).classList.add("emojiEnter")
      setTimeout(()=>{
         document.getElementById(id).classList.remove("emojiEnter")
         document.getElementById(id).classList.add("emojiGoOut")
      },500)
   }

   async updateOnValue () {
      const gameData =  await this.server.getData(`lobbys/${this.lobbyID}`)
      if (!gameData){
         this.getEl('navGames').click()
         return
      } 

      if (gameData.game.state != this.gameState) {
         if (gameData.game.state == "playing") await this.startGame()
         if (gameData.game.state == "ended") await this.endGame()
         if (gameData.game.state == "replay") await this.joinNextLobby()
      }
      const players = Object.values(gameData.players).sort(function(a, b) {return b.score - a.score ;});
      this.elements.first.innerHTML = players[0]  ? "1." + players[0].name  :  "" 
      this.elements.second.innerHTML = players[1] ? "2." + players[1].name  :  "" 
      this.elements.third.innerHTML = players[2]  ? "3." + players[2].name  :  ""
      if (this.countries.length -1 == this.round) await this.upadteScoreBoard()
   }

   async startGame () {
      if (this.isHost) this.gameEndTimer = setTimeout(async ()=> await this.server.setData(`lobbys/${this.lobbyID}/game/state`,"ended"),this.gameParam.time * 1000)
      clearInterval(this.timer)
      this.timer  = setInterval(async ()=>{
         this.time -= 1
         this.elements.timeDisplay.style.width = this.time + "%"
      },this.gameParam.time * 1000 / 100)
      if (this.time <= 0) clearInterval(this.timer)
      
      const gameData =  await this.server.getData(`lobbys/${this.lobbyID}/game`)
      this.countries = gameData.countries
      this.elements.display.innerHTML = this.countries[this.round]
   }

   async endGame () {
      document.querySelector("svg").style.display = "none"
      document.querySelectorAll('.game').forEach((el)=>el.style.display = "none")
      document.querySelectorAll('.scoreBoard').forEach((el)=>{
            el.style.display = "flex"
         }
      )
      if (!this.isHost) this.elements.replay.style.display = "none"
      await this.upadteScoreBoard()
   }

   async upadteScoreBoard() {
      var players = Object.values(await this.server.getData(`lobbys/${this.lobbyID}/players`))
      players = players.sort((a,b)=>b.score-a.score)
      this.elements.playerList.innerHTML = ""
      players.forEach((player)=>{
         const playerToShow = `<div class="card rounded light row"><span id="playerName">${player.name}</span><span id="playerScore">Score : ${player.score ? player.score : 0 }</span></div>`
         this.elements.playerList.innerHTML += playerToShow
      })
   }

   async nextTurn(skip) {
      if (this.countries.length == this.round + 1) return this.endGame()
      if (!skip) this.score += 1 + this.streak
      else this.streak = 0
      this.round += 1
      if (this.streak < 3 && !skip) this.streak += 1
      this.elements.streak.innerHTML = "🔥".repeat(this.streak) + "⚫".repeat(3-this.streak)
      this.elements.display.innerHTML = this.countries[this.round]
      this.elements.score.innerHTML = this.score + "pt"
      await this.server.setData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}/score`,this.score)
   }

   async generateGameData() {
      let countriesData = ( await ( await fetch(`../assets/${this.map}`) ).json() )
      countriesData = countriesData.features.map( countrie => countrie.properties.name)
      let pickedCoutries = []
      for (let i = 0 ; i < this.gameParam.len; i++){
         const randomIndexInArray = Math.round(Math.random()*(countriesData.length-1))
         pickedCoutries.push(countriesData[randomIndexInArray])
         countriesData.splice(randomIndexInArray, 1)
      }
      await this.server.setData(`lobbys/${this.lobbyID}/game/countries`,pickedCoutries)
      await this.server.setData(`lobbys/${this.lobbyID}/game/state`,"playing")
   }

   async pathClicked(e){
      if (this.countries[this.round] ==  e.properties.name){
         this.eventAppear("valid")
         return this.nextTurn(false)
      } 

      this.eventAppear("invalid")
      this.streak = 0
      this.elements.streak.innerHTML = "🔥".repeat(this.streak) + "⚫".repeat(3-this.streak)
  }

   async hostTryConnectToLobby() {
      const hostDataPath = `hosts/${this.authUser.uid}`
      const hostData = await this.server.getData(hostDataPath)
      if (!hostData) return
      this.isHost = true
      this.lobbyID = hostData.id
      await this.server.setData(`lobbys/${this.lobbyID}/game/started`, true)
   }

   async findLobby() {
      const lobbys = Object.entries(await this.server.getData('lobbys'))
      for (let lobby of lobbys) {
         const lobbyID = lobby[0]
         const lobbyPlayers = Object.entries(lobby[1].players || {})
         for (let player of lobbyPlayers) {
            const isUserLobby = player[0] == this.authUser.uid
            if (isUserLobby) this.lobbyID = lobbyID
         }
      }
   }
   
   async deletePlayerOfLobby(playerUid) {
      let playersOnLobby = await this.server.getData(`lobbys/${this.lobbyID}/players`)
      if (!playersOnLobby) return
      delete playersOnLobby[playerUid]
      this.server.setData(`lobbys/${this.lobbyID}/players`, playersOnLobby)
   }

   async update(){

   }

   async joinNextLobby() {
      const nextGameHost = await this.server.getData(`lobbys/${this.lobbyID}/game/host`)
      if (!nextGameHost) return
      await this.server.exeOnChange("hosts",async ()=>{
         const hosts = await this.server.getData('hosts') || {}
         const lobbyCreated = Object.keys(hosts).includes(nextGameHost);
         if (!lobbyCreated) return
         const nextLobbyId = Object.values(await this.server.getData(`hosts/${nextGameHost}`))[0]
         if (nextLobbyId == this.lobbyID) return
         console.log(nextLobbyId)
         await this.server.stopExeOnChange("hosts")
         await this.server.playerConnectToLobby(this.authUser , nextLobbyId )
         this.elements.joinLobbyBtn.href = "/lobby"
         this.elements.joinLobbyBtn.click()
      })
   }

   async swipeNav(diretion){

   }

   async quit() {
      clearInterval(this.timer)
      clearInterval(this.gameEndTimer)
      this.getEl("content").style.paddingTop = "10vh"
      if (this.isHost) {
         this.isHost = false
         this.server.stopExeOnChange(`lobbys/${this.lobbyID}`)
         if (this.replay) await this.server.setData(`lobbys/${this.lobbyID}/game/state`, "replay")
         if (this.replay) await this.server.setData(`lobbys/${this.lobbyID}/game/host`, this.authUser.uid)
         //await new Promise(resolve => setTimeout(resolve, 5000));
         const lobbys = await this.server.getData("lobbys")
         const hosts = await this.server.getData("hosts")
         delete lobbys[this.lobbyID]
         delete hosts[this.authUser.uid]
         await this.server.setData("lobbys", lobbys)
         await this.server.setData("hosts", hosts)
      } else {
         this.server.stopExeOnChange(`lobbys/${this.lobbyID}`)
         await this.deletePlayerOfLobby(this.authUser.uid)
      }
   }
   
   async initMap(){
      const width = window.innerWidth
      const height = window.innerHeight
      var transX = 2
      var transY = 2
      var mapScale = 6
      if (this.map == "us.geojson"){
         transX = 0.7
         transY = 1.5
         mapScale = 2
      }

      const projection = d3.geoMercator()
        .translate([width / transX, height / transY])
        .scale(width/mapScale);

      const path = d3.geoPath()
        .projection(projection);

      const zoom = d3.zoom()
        .scaleExtent([1, 18])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', ()=>g.attr('transform', d3.event.transform));

      const svg = d3.select('#content')
         .append('svg')
         .attr('width', "100%")
         .attr('height', "100%");

      const g = svg.append('g')
      const classThis = this
      d3.json(`../assets/${this.map}`)
      .then(world => {
        g.selectAll('.country')
          .data(world.features)
          .enter().append('path')
          .attr("id", d => d.properties.name)
          .attr('class', 'country')
          .attr("stroke", "black") 
          .attr("stroke-width", "0.1px") 
          .attr('d', path)
          .style("fill", "rgb(255, 255, 209)")
          .on("click",function(e){
            g.selectAll('.country').style("fill", "rgb(255, 255, 209)")
            d3.select(this).style("fill","rgb(107, 107, 87)")
            classThis.pathClicked(e)
          })
      });
      d3.select("svg").on("dblclick.zoom", null); 
      svg.call(zoom);         
   }
}