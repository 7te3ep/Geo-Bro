import { copyToClipboard } from "../modules/copyToClipboard.js"

export class Lobby {
   constructor(server, authUser, router){
      this.layer = 2
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/lobby"
      this.path = "views/lobby.html"
      this.server = server
      this.authUser = authUser
      this.router = router
      this.quitted = false
      this.lobbyHostName
      this.lobbyID
      this.gameParam
      this.waiting = true
   }



   async init() {
      await this.router.loadPage(this.link,this.path)
      await this.findLobby()
      this.elements["playersList"] = this.getEl("playersList")
      this.elements["lobbyId"] = this.getEl("lobbyId")
      this.elements["gameLaunch"] = this.getEl("gameLaunch")
      this.elements["lobbyName"] = this.getEl("lobbyName")
      this.elements["mapParam"] = this.getEl("mapParam")
      this.elements["timeParam"] = this.getEl("timeParam")
      this.elements["lobbyImg"] = this.getEl("lobbyImg")
      this.elements["lenParam"] = this.getEl("lenParam")
      this.elements["waiting"] = this.getEl("waiting")
      this.gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`)
      await this.server.exeOnChange(`lobbys/${this.lobbyID}`,()=>{return this.updateOnValue()})

      this.getEl("copyToClipboardBtn").addEventListener('click',()=>{
         copyToClipboard(copyToClipboard(`geobro.online/lobby:${this.lobbyID}`))
      })
      await this.server.onDisconnectRemove(`lobbys/${this.lobbyID}/players/${this.authUser.uid}`)
   }

   async findLobby() {
      const lobbys = Object.entries(await this.server.getData('lobbys') || {})
      for (let lobby of lobbys) {
         const lobbyID = lobby[0]
         const lobbyPlayers = Object.entries(lobby[1].players || {})
         for (let player of lobbyPlayers) {
            const isUserLobby = player[0] == this.authUser.uid
            if (isUserLobby) this.lobbyID = lobbyID
         }
      }
   }

   async update() {
      this.elements.lobbyId.innerHTML = this.lobbyID
      this.elements.lobbyName.innerHTML = await this.server.getData(`lobbys/${this.lobbyID}/param/lobbyName`)
   }

   async updateOnValue() {
      const hasBeenKicked = await this.server.getData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}`)
      const gameStarted = await this.server.getData(`lobbys/${this.lobbyID}/game/started`)
      if (!hasBeenKicked){
         return this.getEl('navGames').click()
      } 
      else if (gameStarted && !this.quitted) {
         if (this.gameParam.gamemode == "speedrun") this.elements.gameLaunch.href = "/speedrun"
         this.elements.gameLaunch.click()
         await this.server.stopExeOnChange(`lobbys/${this.lobbyID}`)
         this.quitted = true
      } 
      else {
         await this.updatePlayerList()
         await this.updateGameParam()
         const lobbyWaitingForParam = this.gameParam.gamemode == ""
         if (!lobbyWaitingForParam && this.waiting ) {
            this.waiting = false
            this.elements.waiting.style.display = "none"
            this.initParam()
         }
      }
   }

   async initParam() {
      if (this.gameParam.gamemode == "speedrun"){
         this.elements.timeParam.style.display = "none"
         this.elements.lenParam.style.display = "none"
      } 
   }

   async updatePlayerList(){
      this.elements.playersList.innerHTML = ""
      const lobbyData = await this.server.getData(`lobbys/${this.lobbyID}`)
      const players = Object.values(lobbyData.players || {}) 
      for (let player of players){
         const playerEl = `<div class="card electricBlue rounded "><div class="row"><img alt="profile image of user" class="userImg" src="${player.img}"><p>${player.name}</p></div></div>`
         this.elements.playersList.innerHTML += playerEl
      }
   }

   async updateGameParam(){
      this.gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`)
      let fullMapName 
      if (this.gameParam.map == "world") fullMapName = "Pays du monde"
      if (this.gameParam.map == "us") fullMapName = "Etats des Etats Unis"
      if (this.gameParam.map == "fr") fullMapName = "Departements de France"
      this.elements.mapParam.innerHTML = `Carte : ${fullMapName}`
      this.elements.timeParam.innerHTML = `Temps : ${this.gameParam.time}s`
      this.elements.lenParam.innerHTML = `Nombre d'elements : ${this.gameParam.len}`

      this.elements.lobbyImg.src = `../assets/${this.gameParam.gamemode}.png`
   }

   async deletePlayerOfLobby(playerUid){
      let playersOnLobby = await this.server.getData(`lobbys/${this.lobbyID}/players`)
      if (!playersOnLobby) return
      delete playersOnLobby[playerUid]
      this.server.setData(`lobbys/${this.lobbyID}/players`, playersOnLobby)
   }

   async quit() {
      await this.server.stopExeOnChange(`lobbys/${this.lobbyID}`)
      await this.deletePlayerOfLobby(this.authUser.uid)
   }
}