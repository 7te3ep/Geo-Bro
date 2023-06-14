import { copyToClipboard } from "../modules/copyToClipboard.js"

export class Lobby {
   constructor(server, authUser, router){
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
   }

   async update() {
      this.elements.lobbyId.innerHTML = this.lobbyID
   }

   async updateOnValue() {
      const hasBeenKicked = await this.server.getData(`lobbys/${this.lobbyID}/players/${this.authUser.uid}`)
      const gameStarted = await this.server.getData(`lobbys/${this.lobbyID}/game/started`)
      console.log("Lobby Init",gameStarted);
      if (!hasBeenKicked) return this.getEl('navGames').click()
      else if (gameStarted && !this.quitted) {
         this.elements.gameLaunch.click()
         this.quitted = true
      } 
      else await this.updatePlayerList()
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      await this.findLobby()
      await this.server.exeOnChange(`lobbys/${this.lobbyID}`,()=>{return this.updateOnValue()})
      this.elements["playersList"] = this.getEl("playersList")
      this.elements["lobbyId"] = this.getEl("lobbyId")
      this.elements["gameLaunch"] = this.getEl("gameLaunch")
      
      this.getEl("copyToClipboardBtn").addEventListener('click',()=>{
         copyToClipboard(this.lobbyID)
      })
      await this.server.onDisconnectRemove(`lobbys/${this.lobbyID}/players/${this.authUser.uid}`)
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
         const playerEl = `<div class="card electricBlue rounded "><div class="row"><img alt="profile image of user" class="userImg" src="${player.img}"><p>${player.name}</p></div></div>`
         this.elements.playersList.innerHTML += playerEl
      }
   }

   async deletePlayerOfLobby(playerUid){
      let playersOnLobby = await this.server.getData(`lobbys/${this.lobbyID}/players`)
      if (!playersOnLobby) return
      delete playersOnLobby[playerUid]
      this.server.setData(`lobbys/${this.lobbyID}/players`, playersOnLobby)
   }

   async quit() {
      this.server.stopExeOnChange(`lobbys/${this.lobbyID}`)
      await this.deletePlayerOfLobby(this.authUser.uid)
   }
}
