import { copyToClipboard } from "./copyToClipboard.js"

export class HostLobby {
   constructor(server, authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/hostLobby"
      this.path = "views/hostLobby.html"
      this.server = server
      this.authUser = authUser
      this.router = router
      this.lobbyHostName
      this.lobbyID
   }

   async update() {
      this.elements.lobbyId.innerHTML = this.lobbyID
      this.elements.lobbyHostName.innerHTML = this.lobbyHostName
   }

   async updateOnValue() {
      await this.updatePlayerList()
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
   
      await this.server.newLobbyOnDb(this.authUser)
      const hostDataPath = `hosts/${this.authUser.uid}`
      const hostData = await this.server.getData(hostDataPath)
      this.lobbyHostName = hostData.name
      this.lobbyID = hostData.id

      this.elements["lobbyId"] = this.getEl("lobbyId")
      this.elements["lobbyHostName"] = this.getEl("lobbyHostName")
      this.elements["playersList"] = this.getEl("playersList")
      await this.server.playerConnectToLobby(this.authUser, this.lobbyID)
      await this.server.exeOnChange(`lobbys/${this.lobbyID}`,()=>{this.updateOnValue()})

      this.getEl("copyToClipboardBtn").addEventListener('click',()=>{
         copyToClipboard(this.lobbyID)
      })
   }

   async updatePlayerList(){
      this.elements.playersList.innerHTML = " "
      const lobbyData = await this.server.getData(`lobbys/${this.lobbyID}`)
      const players = Object.entries(lobbyData.players || {}) 
      for (let player of players){
         const playerData = player[1]
         let isHost = false
         if (player[0] == this.authUser.uid) isHost = true
         const deleteBtn = isHost ? "" : `<div class="btn rounded bad kickBtn" id="${player[0]}" >Kick</div>`
         const playerEl = `<div class="card electricBlue rounded row"><div class="row"><img class="userImg" src="${playerData.img}"><p>${playerData.name}</p></div>`+deleteBtn+`</div>`
         this.elements.playersList.innerHTML += playerEl
      }

      document.querySelectorAll(".kickBtn").forEach((kickBtn)=>{
         kickBtn.addEventListener("click",async ()=>{
            const playerUid = kickBtn.id
            await this.deletePlayerOfLobby(playerUid)
         })
      })
   }

   async deletePlayerOfLobby(playerUid){
      let playersOnLobby = await this.server.getData(`lobbys/${this.lobbyID}/players`)
      delete playersOnLobby[playerUid]
      this.server.setData(`lobbys/${this.lobbyID}/players`, playersOnLobby)
   }
}

export class Lobby {
   constructor(server, authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/lobby"
      this.path = "views/lobby.html"
      this.server = server
      this.authUser = authUser
      this.router = router
      this.lobbyHostName
      this.lobbyID
   }

   async update() {
      this.elements.lobbyId.innerHTML = this.lobbyID
   }

   async updateOnValue() {
      const hasBeenKicked = await this.server.getData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}`)
      if (!hasBeenKicked) this.getEl('navGames').click()
      await this.updatePlayerList()
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      await this.findLobby()
      await this.server.exeOnChange(`lobbys/${this.lobbyID}`,()=>{return this.updateOnValue()})
      this.elements["playersList"] = this.getEl("playersList")
      this.elements["lobbyId"] = this.getEl("lobbyId")
      
      this.getEl("copyToClipboardBtn").addEventListener('click',()=>{
         copyToClipboard(this.lobbyID)
      })
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

   async updatePlayerList(){
      this.elements.playersList.innerHTML = ""
      const lobbyData = await this.server.getData(`lobbys/${this.lobbyID}`)
      const players = Object.values(lobbyData.players || {}) 
      for (let player of players){
         const playerEl = `<div class="card electricBlue rounded "><div class="row"><img class="userImg" src="${player.img}"><p>${player.name}</p></div></div>`
         this.elements.playersList.innerHTML += playerEl
      }
   }
}

export class CountryGame {
   constructor(server, authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/country"
      this.path = "views/countryGames.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      const userData = (await this.server.getData(`users/${this.authUser.uid}`)).data
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      const width = window.innerWidth
      const height = window.innerHeight

      const projection = d3.geoMercator()
        .translate([width / 2, height / 2])
        .scale(width/5);

      const path = d3.geoPath()
        .projection(projection);

      const zoom = d3.zoom()
        .scaleExtent([1, 18])
        .on('zoom', ()=>g.attr('transform', d3.event.transform));

      const svg = d3.select('#content')
         .append('svg')
         .attr('width', width)
         .attr('height', height);

      const g = svg.append('g');

      svg.call(zoom);

      d3.json('../assets/countries.geo.json')
      .then(world => {
        g.selectAll('.country')
          .data(world.features)
          .enter().append('path')
          .attr("id", d => d.properties.name)
          .attr('class', 'country')
          .attr('d', path)
          .style("fill", function(){return "rgb("+Math.random()*255+","+Math.random()*255+","+Math.random()*255+")"})
          .on("click",(e)=>{
            pathClicked(e)
          });
      });

   d3.select("svg").attr('id',"map").on("dblclick.zoom", null); // Désactive le zoom avec un double click               
   }
}