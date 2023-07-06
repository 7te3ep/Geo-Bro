import { copyToClipboard } from "../modules/copyToClipboard.js"

export class HostLobby {
   constructor(server, authUser, router){
      this.layer = 2
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/hostLobby"
      this.path = "views/hostLobby.html"
      this.server = server
      this.authUser = authUser
      this.router = router
      this.lobbyHostName
      this.lobbyID
      this.gameParam
      this.mapLen = {}
   }

   async update() {
      this.elements.lobbyId.innerHTML = this.lobbyID
      this.elements.lobbyHostName.innerHTML = this.lobbyHostName
      this.elements.lobbyName.innerHTML = this.gameParam.lobbyName
   }

   async updateParameters(len,time,visibility){
      this.elements.timeRange.value = time
      this.elements.timeDisplay.innerHTML = "Temps de la partie : " + time + "sec"
      this.elements.gameLenRange.value = len
      this.elements.gameLenDisplay.innerHTML = "Nombre de pays a trouver : " + len
      this.elements.visibilityDisplay.innerHTML = visibility == "private" ? `Lobby privé 🔒 : ` : `Lobby publique 🌐 :`
   }

   async updateOnValue() {
      await this.updatePlayerList()
      this.gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`)
      await this.updateParameters(this.gameParam.len,this.gameParam.time,this.gameParam.visibility)
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      await this.server.newLobbyOnDb(this.authUser)
      const hostData = await this.server.getData(`hosts/${this.authUser.uid}`)
      this.lobbyHostName = hostData.name
      this.lobbyID = hostData.id
      this.gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`)

      this.elements["lobbyId"] = this.getEl("lobbyId")
      this.elements["lobbyHostName"] = this.getEl("lobbyHostName")
      this.elements["playersList"] = this.getEl("playersList")
      this.elements["gameLenRange"] = this.getEl("gameLenRange")
      this.elements["gameLenDisplay"] = this.getEl("gameLenDisplay")
      this.elements["timeRange"] = this.getEl("timeRange")
      this.elements["timeDisplay"] = this.getEl("timeDisplay")
      this.elements["mapSelect"] = this.getEl("mapSelect")
      this.elements["visibilityDisplay"] = this.getEl("visibilityDisplay")
      this.elements["visibilityCheckBox"] = document.querySelector("input[name=checkbox]");
      this.elements["lobbyName"] = this.getEl("lobbyName")
      this.mapLen['us'] = ((await (await (fetch("../../assets/us-states_optimized.geojson"))).json()).features).length -1
      this.mapLen['fr'] = ((await (await (fetch("../../assets/french-departments_optimized.geojson"))).json()).features).length -1
      this.mapLen['world'] = ((await (await (fetch("../../assets/world-countries_optimized.geojson"))).json()).features).length -1
      const viewReference = this

      await this.server.exeOnChange(`lobbys/${this.lobbyID}`,()=>{this.updateOnValue()})

      this.getEl("copyToClipboardBtn").addEventListener('click',()=>{
         copyToClipboard(this.lobbyID)
      })

      this.elements.visibilityCheckBox.addEventListener('change',async function () {
         if (this.checked) await viewReference.server.setData(`lobbys/${viewReference.lobbyID}/param/visibility`,"public")
         else await viewReference.server.setData(`lobbys/${viewReference.lobbyID}/param/visibility`,"private")
      });

      this.elements.timeRange.addEventListener("input",async (event) => {
         await this.server.setData(`lobbys/${this.lobbyID}/param/time`,this.elements.timeRange.value)
      })

      this.elements.gameLenRange.addEventListener("input",async (event) => {
         await this.server.setData(`lobbys/${this.lobbyID}/param/len`,this.elements.gameLenRange.value)
      })

      this.elements.mapSelect.onchange = ("input",async (event) => {
         const updateParam =async  (mapId)=>{
            this.elements.gameLenRange.setAttribute("max",this.mapLen[mapId])
            this.elements.gameLenRange.value = this.mapLen[mapId]
            await this.server.setData(`lobbys/${this.lobbyID}/param/len`,this.elements.gameLenRange.value)
         }
         if (this.elements.mapSelect.value == "fr") await updateParam("fr")
         if (this.elements.mapSelect.value == "world") await updateParam("world")
         if (this.elements.mapSelect.value == "us") await updateParam("us")
         await this.server.setData(`lobbys/${this.lobbyID}/param/map`,this.elements.mapSelect.value)
      })

      await this.server.onDisconnectRemove(`lobbys/${this.lobbyID}`)
      await this.server.onDisconnectRemove(`hosts/${this.authUser.uid}`)
      await this.server.onDisconnectRemove(`replayStack/${this.authUser.uid}`)
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
         const playerEl = `<div class="card electricBlue rounded row"><div class="row"><img alt="profile image of user" class="userImg" src="${playerData.img}"><p>${playerData.name}</p></div>`+deleteBtn+`</div>`
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
      await this.server.removeData(`replayStack/${this.authUser.uid}`)
      this.server.stopExeOnChange(`lobbys/${this.lobbyID}`)
      const lobbys = await this.server.getData("lobbys")
      const hosts = await this.server.getData("hosts")
      delete lobbys[this.lobbyID]
      if (this.authUser.uid) delete hosts[this.authUser.uid]
      await this.server.setData("lobbys", lobbys)
      await this.server.setData("hosts", hosts)
   }
}