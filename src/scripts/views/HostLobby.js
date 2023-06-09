import { copyToClipboard } from "../modules/copyToClipboard.js"

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

   async updateParameters(len,time){
      this.elements.timeRange.value = time
      this.elements.timeDisplay.innerHTML = "Temps de la partie : " + time + "sec"
      this.elements.gameLenRange.value = len
      this.elements.gameLenDisplay.innerHTML = "Nombre de pays a trouver : " + len
   }

   async updateOnValue() {
      await this.updatePlayerList()
      const gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`)
      await this.updateParameters(gameParam.len,gameParam.time)
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
      this.elements["gameLenRange"] = this.getEl("gameLenRange")
      this.elements["gameLenDisplay"] = this.getEl("gameLenDisplay")
      this.elements["timeRange"] = this.getEl("timeRange")
      this.elements["timeDisplay"] = this.getEl("timeDisplay")
      await this.server.playerConnectToLobby(this.authUser, this.lobbyID)
      await this.server.exeOnChange(`lobbys/${this.lobbyID}`,()=>{this.updateOnValue()})

      this.getEl("copyToClipboardBtn").addEventListener('click',()=>{
         copyToClipboard(this.lobbyID)
      })

      this.elements.timeRange.addEventListener("input",async (event) => {
         await this.server.setData(`lobbys/${this.lobbyID}/param/time`,this.elements.timeRange.value)
      })
      this.elements.gameLenRange.addEventListener("input",async (event) => {
         await this.server.setData(`lobbys/${this.lobbyID}/param/len`,this.elements.gameLenRange.value)
      })

      await this.server.onDisconnectRemove(`lobbys/${this.lobbyID}`)
      await this.server.onDisconnectRemove(`hosts/${this.authUser.uid}`)
   }

   async updatePlayerList(){
      this.elements.playersList.innerHTML = " "
      const lobbyData = await this.server.getData(`lobbys/${this.lobbyID}`)
      if (!lobbyData) return
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

   async quit() {
      this.server.stopExeOnChange(`lobbys/${this.lobbyID}`)
      const lobbys = await this.server.getData("lobbys")
      const hosts = await this.server.getData("hosts")
      delete lobbys[this.lobbyID]
      delete hosts[this.authUser.uid]
      await this.server.setData("lobbys", lobbys)
      await this.server.setData("hosts", hosts)
   }
}