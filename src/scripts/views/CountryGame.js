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
      this.initMap()
      await this.hostTryConnectToLobby()
      if (!this.isHost) await this.findLobby()
      await this.server.exeOnChange(`lobbys/${this.lobbyID}`,()=>{return this.updateOnValue()})
      this.gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`)
      if (this.isHost){
         await this.generateGameData()
      }

      this.elements.skipButton.addEventListener('click',()=>{
         this.nextTurn(true)
      })
   }

   async updateOnValue () {
      const gameData =  await this.server.getData(`lobbys/${this.lobbyID}`)
      if (!gameData){
         this.getEl('navGames').click()
         return
      } 

      if (gameData.game.state != this.gameState) {
         if (gameData.game.state == "playing") this.startGame()
         if (gameData.game.state == "ended") this.endGame()
      }
      const players = Object.values(gameData.players).sort(function(a, b) {return b.score - a.score ;});
      this.elements.first.innerHTML = players[0]  ? "1." + players[0].name  :  "" 
      this.elements.second.innerHTML = players[1] ? "2." + players[1].name  :  "" 
      this.elements.third.innerHTML = players[2]  ? "3." + players[2].name  :  ""
      if (this.countries.length -1 == this.round) await this.upadteScoreBoard()
   }

   async startGame () {
      if (this.isHost) setTimeout(async ()=>  await this.server.setData(`lobbys/${this.lobbyID}/game/state`,"ended"),this.gameParam.time * 1000)
      const reduceTimeDisplay = setInterval(async ()=>{
         this.time -= 1
         this.elements.timeDisplay.style.width = this.time + "%"
      },this.gameParam.time * 1000 / 100)
      if (this.time <= 0) clearInterval(reduceTimeDisplay)
      
      const gameData =  await this.server.getData(`lobbys/${this.lobbyID}/game`)
      this.countries = gameData.countries
      this.elements.display.innerHTML = this.countries[this.round]
   }

   async endGame () {
      document.querySelector("svg").style.display = "none"
      document.querySelectorAll('.game').forEach((el)=>el.style.display = "none")
      document.querySelectorAll('.scoreBoard').forEach((el)=>el.style.display = "flex")
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
      let countriesData = ( await ( await fetch('../assets/countriesFR.geo.json') ).json() )
      countriesData = countriesData.features.map( countrie => countrie.properties.name)
      let pickedCoutries = []
      for (let i = 0 ; i < this.gameParam.len; i++){
         const randomIndexInArray = Math.round(Math.random()*(countriesData.length-1))
         pickedCoutries.push(countriesData[randomIndexInArray])
         countriesData.slice(randomIndexInArray)
      }
      await this.server.setData(`lobbys/${this.lobbyID}/game/countries`,pickedCoutries)
      await this.server.setData(`lobbys/${this.lobbyID}/game/state`,"playing")
   }

   async pathClicked(e){
      if (this.countries[this.round] ==  e.properties.name) return this.nextTurn(false)
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
   
   async deletePlayerOfLobby(playerUid){
      let playersOnLobby = await this.server.getData(`lobbys/${this.lobbyID}/players`)
      if (!playersOnLobby) return
      delete playersOnLobby[playerUid]
      this.server.setData(`lobbys/${this.lobbyID}/players`, playersOnLobby)
   }

   async update(){

   }

   async quit() {
      this.getEl("content").style.paddingTop = "10vh"
      if (this.isHost) {
         this.isHost = false
         this.server.stopExeOnChange(`lobbys/${this.lobbyID}`)
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

      const projection = d3.geoMercator()
        .translate([width / 2, height / 2])
        .scale(width/6);

      const path = d3.geoPath()
        .projection(projection);

      const zoom = d3.zoom()
        .scaleExtent([1, 18])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', ()=>g.attr('transform', d3.event.transform));

      const svg = d3.select('#content')
         .append('svg')
         .attr('width', width)
         .attr('height', height);

      const g = svg.append('g');
      const classThis = this
      d3.json('../assets/countriesFR.geo.json')
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
            console.log(e)
            g.selectAll('.country').style("fill", "rgb(255, 255, 209)")
            d3.select(this).style("fill","rgb(145, 145, 31)")
            classThis.pathClicked(e)
          })
      });
      d3.select("svg").on("dblclick.zoom", null); 
      var myimage = svg.append('image')
       .attr('xlink:href', '../assets/pointer.png')
       .attr('x', 500)
      svg.call(zoom);         
      myimage.call(zoom); 
   }
}