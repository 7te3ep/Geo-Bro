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
      this.currentRound = 0
      this.countries
      this.guess = ""
      this.score = 0
   }

   async updateOnValue () {
      const gameData =  await this.server.getData(`lobbys/${this.lobbyID}`)
      if (!gameData){
         this.getEl('navGames').click()
         return
      } 
      if (this.isHost) return
      if (gameData.game.round != this.currentRound) this.endRound()
      if (gameData.game.started == true) this.hidePanelAndStartGame()
   }

   async update(){

   }

   async startRound() {
      this.elements.display.innerHTML =this.countries[this.currentRound]
      if (this.isHost) setTimeout(async()=> this.endRound(),7000)
   }

   async endRound() {
      if (this.countries[this.currentRound] == this.guess) this.score += 1 
      this.currentRound ++ 
      await this.server.setData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}/score`,this.score)
      if (this.isHost) await this.server.setData(`lobbys/${this.lobbyID}/game/round`,this.currentRound)
      if (this.isHost) await this.server.setData(`lobbys/${this.lobbyID}/game/started`,false)
      if (!this.isHost) this.currentRound = await this.server.getData(`lobbys/${this.lobbyID}/game/round`)
      if  (this.currentRound % 3 == 0 ) await this.showGamePanel() 
      else this.startRound()
   }

   async showGamePanel() {
      this.elements.display.innerHTML = ""
      document.querySelectorAll(".scoreBoard").forEach((el)=>el.style.display = "block")
      if (!this.isHost) this.elements.nextRoundBtn.style.display = "none"
      document.querySelector("svg").style.display = "none"
      var players = Object.values(await this.server.getData(`lobbys/${this.lobbyID}/players`))
      players = players.sort((a,b)=>b.score-a.score)
      this.elements.playerList.innerHTML = ""
      players.forEach((player)=>{
         const playerToShow = `<div class="card rounded light row"><span id="playerName">${player.name}</span><span id="playerScore">Score : ${player.score}</span></div>`
         this.elements.playerList.innerHTML += playerToShow
      })
   }

   async hidePanelAndStartGame() {
      document.querySelectorAll(".scoreBoard").forEach((el)=>el.style.display = "none")
      document.querySelector("svg").style.display = "block"
      if (this.isHost) await this.server.setData(`lobbys/${this.lobbyID}/game/started`,true)
      this.startRound()
   }

   async generateGameData() {
      let countriesData = ( await ( await fetch('../assets/countries.geo.json') ).json() )
      countriesData = countriesData.features.map( countrie => countrie.properties.name)
      let pickedCoutries = []
      for (let i = 0 ; i < 30; i++){
         const randomIndexInArray = Math.round(Math.random()*(countriesData.length-1))
         pickedCoutries.push(countriesData[randomIndexInArray])
      }
      await this.server.setData(`lobbys/${this.lobbyID}/game/countrys`,pickedCoutries)
      await this.server.setData(`lobbys/${this.lobbyID}/game/round`,this.currentRound)
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      document.querySelectorAll(".scoreBoard").forEach((el)=>el.style.display = "none")
      await this.hostConnectToLobby()
      if (!this.isHost) await this.findLobby()
      if (this.isHost) await this.generateGameData()
      await this.server.exeOnChange(`lobbys/${this.lobbyID}`,()=>{return this.updateOnValue()})
      this.elements["display"] = this.getEl("display")
      this.elements["nextRoundBtn"] = this.getEl("nextRoundBtn")
      this.elements["playerList"] = this.getEl("playerList")
      this.initMap()
      this.countries = (await this.server.getData(`lobbys/${this.lobbyID}/game/countrys`) )
      await this.startRound()

      this.elements.nextRoundBtn.addEventListener("click",()=>{
         this.hidePanelAndStartGame()
      })
   }

   async pathClicked(e){
      this.guess = e.properties.name
  }

   async hostConnectToLobby() {
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

   async quit() {
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
      d3.json('../assets/countries.geo.json')
      .then(world => {
        g.selectAll('.country')
          .data(world.features)
          .enter().append('path')
          .attr("id", d => d.properties.name)
          .attr('class', 'country')
          .attr("stroke", "black") 
          .attr("stroke-width", "0.1px") 
          .attr('d', path)
          .style("fill", "rgb(194, 255, 236)")
          .on("click",function(e){
            g.selectAll('.country').style("fill", "rgb(194, 255, 236)")
            d3.select(this).style("fill","rgb(0, 255, 162)")
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