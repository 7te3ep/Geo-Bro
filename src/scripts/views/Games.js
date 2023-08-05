export class Games {
   constructor(server, authUser, router){
      this.layer = 1 
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/games"
      this.path = "views/games.html"
      this.server = server
      this.authUser = authUser
      this.router = router
      this.canConnect = true
   }

   async update() {
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      document.querySelectorAll(".navIcon").forEach(icon=>icon.classList.remove("iconFocus"))
      this.getEl("gamesIcon").classList.add("iconFocus")
   
      this.elements["lobbyIdInput"] = this.getEl("lobbyIdInput")
      this.elements["joinLobbyBtn"] = this.getEl("joinLobbyBtn")
      this.elements["lobbysGallery"] = this.getEl("lobbysGallery")
      
      if (await this.server.getData(`users/${this.authUser.uid}/tuto`) == true){
         this.getEl('gamesIcon').classList.remove('focus')
         this.getEl('createLobbyBtn').classList.add('focus')
      }

      this.elements.joinLobbyBtn.addEventListener('click',async ()=>{
         const lobbyId = this.elements.lobbyIdInput.value
         const lobbyExist = await this.server.getData(`lobbys/${lobbyId}`)
         if (!lobbyExist || !this.canConnect) return
         this.canConnect = false
         await this.server.playerConnectToLobby(this.authUser , lobbyId )
         this.elements.joinLobbyBtn.href = "/lobby"
         this.elements.joinLobbyBtn.click()
      })

      await this.server.exeOnChange("lobbys",async ()=>{
         const lobbys = Object.entries(await this.server.getData("lobbys") || {})
         const realLobbys = lobbys.filter((lobby)=>"param" in lobby[1] && "players" in lobby[1] && "game" in lobby[1])
         const waitingLobbyys = realLobbys.filter((lobby)=>lobby[1].game.started == false)
         const publicLobbys = waitingLobbyys.filter((lobby)=>lobby[1].param.visibility == "public")
         if (waitingLobbyys.length == 0) return 
         await this.tryConnectToLobby(waitingLobbyys)
         await this.updateLobbysGallery(publicLobbys)
      })
   }
   async tryConnectToLobby(lobbys){
      if (!this.canConnect) return
      if (lobbys.find(element => this.authUser.uid in element[1].players ) && this.canConnect) {
         this.canConnect = false
         await this.server.stopExeOnChange("lobbys")
         this.elements.joinLobbyBtn.href = "/lobby"
         this.elements.joinLobbyBtn.click()
      } 
   }

   async updateLobbysGallery(lobbys) {
      this.elements.lobbysGallery.innerHTML = ""
      if (lobbys.length == 0) {
         this.elements.lobbysGallery.innerHTML = "<div class='title'>Aucune pour le moment !</div>"
         return
      }
      lobbys.forEach(lobby => {
         const lobbyId = lobby[0]
         const lobbyName = lobby[1].param.lobbyName
         const gamemode = lobby[1].param.gamemode
         this.elements.lobbysGallery.innerHTML += 
         `<div class="card rounded electricBlue row"><img style="width: 5vw; min-width: 50px;" src="../assets/${gamemode}.png" alt=""><span id="lobbyName" class="title">${lobbyName}</span><a class="btn good joinPublicLobbyBtn" id="${lobbyId}"><i class="fa-solid fa-right-to-bracket"></i></a></div>`
      });

      document.querySelectorAll(".joinPublicLobbyBtn").forEach((joinBtn)=>{
         joinBtn.addEventListener("click",async ()=>{
            if (!this.canConnect) return
            this.canConnect = false
            await this.server.stopExeOnChange("lobbys")
            await this.server.playerConnectToLobby(this.authUser , joinBtn.id )
            this.elements.joinLobbyBtn.href = "/lobby"
            this.elements.joinLobbyBtn.click()
         })
      })
   }

   async swipeNav(diretion){
      if (diretion == "left") this.getEl("navSocial").click()
      else this.getEl("navDashboard").click()
   }


   async quit() {
      await this.server.stopExeOnChange('lobbys')
   }
}