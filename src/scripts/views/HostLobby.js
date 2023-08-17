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
      this.canConnect = true
   }

   async init() {

      await this.router.loadPage(this.link,this.path)
      const hostData = await this.server.getData(`hosts/${this.authUser.uid}`)
      this.lobbyHostName = hostData.name
      this.lobbyID = hostData.id
      this.gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`)
      await this.server.setData(`lobbys/${this.lobbyID}/param/host`,this.authUser.uid)

      this.elements["lobbyId"] = this.getEl("lobbyId")
      this.elements["lobbyHostName"] = this.getEl("lobbyHostName")
      this.elements["playersList"] = this.getEl("playersList")
      this.elements["gameLenRange"] = this.getEl("gameLenRange")
      this.elements["gameLenDisplay"] = this.getEl("gameLenDisplay")
      this.elements["timeRange"] = this.getEl("timeRange")
      this.elements["timeDisplay"] = this.getEl("timeDisplay")
      this.elements["visibilityDisplay"] = this.getEl("visibilityDisplay")
      this.elements["lobbyImg"] = this.getEl("lobbyImg")
      this.elements["visibilityCheckBox"] = document.querySelector("input[name=checkbox]");
      this.elements["lobbyName"] = this.getEl("lobbyName")
      this.elements["play"] = this.getEl("play")
      this.mapLen['us'] = ((await (await (fetch("../../assets/us-states_optimized.geojson"))).json()).features).length -1
      this.mapLen['fr'] = ((await (await (fetch("../../assets/french-departments_optimized.geojson"))).json()).features).length -1
      this.mapLen['world'] = ((await (await (fetch("../../assets/world-countries_optimized.geojson"))).json()).features).length -1
      const viewReference = this
      
      if (this.gameParam.gamemode == "speedrun"){
         this.getEl('time').style.display = "none"
         this.getEl('len').style.display = "none"
      } 
      if (this.gameParam.gamemode == "championnat"){
         this.getEl('time').style.display = "none"
         this.getEl('len').style.display = "none"
      } 

      this.elements.play.addEventListener('click',async ()=>{
         if (!this.canConnect) return
         this.canConnect = false
         await this.server.stopExeOnChange(`lobbys/${this.lobbyID}/players`)
         await this.server.stopExeOnChange(`lobbys/${this.lobbyID}/param`)
         this.elements.play.href = `/${this.gameParam.gamemode}`
      })

      await this.server.exeOnChange(`lobbys/${this.lobbyID}/param`,()=>{this.updateParameters()})
      await this.server.exeOnChange(`lobbys/${this.lobbyID}/players`,()=>{this.updatePlayerList()})

      this.getEl("copyToClipboardBtn").addEventListener('click',()=>{
         copyToClipboard(`https://geobro.online/lobby:${this.lobbyID}`)
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

      await this.server.onDisconnectRemove(`lobbys/${this.lobbyID}`)
      await this.server.onDisconnectRemove(`hosts/${this.authUser.uid}`)
      await this.server.onDisconnectRemove(`replayStack/${this.authUser.uid}`)
   }


   async update() {
      this.elements.lobbyId.innerHTML = this.lobbyID
      this.elements.lobbyHostName.innerHTML = this.lobbyHostName
      this.elements.lobbyName.innerHTML = this.gameParam.lobbyName
   }

   async updateParameters(){
      this.gameParam = await this.server.getData(`lobbys/${this.lobbyID}/param`)
      const param = this.gameParam
      const gamemodeHasBeenSet = param["gamemode"]
      if (gamemodeHasBeenSet &&param.gamemode == "speedrun") param.len = this.mapLen[param.map]
      this.elements.timeRange.value = param.time
      this.elements.timeDisplay.innerHTML = "Temps de la partie : " + param.time + "sec"
      this.elements.gameLenRange.value = param.len
      this.elements.gameLenDisplay.innerHTML = "Nombre de pays a trouver : " + param.len
      this.elements.visibilityDisplay.innerHTML = param.visibility == "private" ? `Lobby privé 🔒 : ` : `Lobby publique 🌐 :`
      this.elements.lobbyImg.src = `../assets/${param.gamemode}.png`
   }

   async updatePlayerList(){
      this.elements.playersList.innerHTML = " "
      const players = Object.entries(await this.server.getData(`lobbys/${this.lobbyID}/players`) || {}) 
      const voeu = players.filter((player)=>player[1].team == "voeu")
      const serment = players.filter((player)=>player[1].team == "serment")
      const noTeam = players.filter((player)=>player[1].team == undefined)
      const pacte = players.filter((player)=>player[1].team == "pacte")

      if (this.gameParam.gamemode == "championnat") {
         const addTeam = (players,name)=>{
            this.elements.playersList.innerHTML += `<p class="title" >${name}</p>`
            for (let player of players){
               const deleteBtn = player[0] == this.authUser.uid ? "" : `<div class="btn rounded bad kickBtn" id="${player[0]}" >Kick</div>`
               const playerEl = `<div class="card electricBlue rounded row"><div class="row"><img alt="profile image of user" class="userImg" src="${player[1].img}"><p>${player[1].name}</p></div>${player[0] != this.gameParam.host ? name : "Admin"}`+deleteBtn+`</div>`
               this.elements.playersList.innerHTML += playerEl
            }
         }
         addTeam(voeu,"voeu")
         addTeam(serment,"serment")
         addTeam(pacte,"pacte")
         addTeam(noTeam,"pas d'equipe")
      }else {
         for (let player of players){
            const playerData = player[1]
            let isHost = false
            if (player[0] == this.authUser.uid) isHost = true
            const deleteBtn = isHost ? "" : `<div class="btn rounded bad kickBtn" id="${player[0]}" >Kick</div>`
            const playerEl = `<div class="card electricBlue rounded row"><div class="row"><img alt="profile image of user" class="userImg" src="${playerData.img}"><p>${playerData.name}</p>  </div>`+deleteBtn+`</div> `
            this.elements.playersList.innerHTML += playerEl
         }
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
      await this.server.stopExeOnChange(`lobbys/${this.lobbyID}/players`)
      await this.server.stopExeOnChange(`lobbys/${this.lobbyID}/param`)
      const lobbys = await this.server.getData("lobbys")
      const hosts = await this.server.getData("hosts")
      delete lobbys[this.lobbyID]
      if (this.authUser.uid) delete hosts[this.authUser.uid]
      await this.server.setData("lobbys", lobbys)
      await this.server.setData("hosts", hosts)
   }
}