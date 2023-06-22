export class Games {
   constructor(server, authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/games"
      this.path = "views/games.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      const userData = (await this.server.getData(`users/${this.authUser.uid}`)).data
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      document.querySelectorAll(".navIcon").forEach(icon=>icon.classList.remove("iconFocus"))
      this.getEl("gamesIcon").classList.add("iconFocus")

      this.elements["lobbyIdInput"] = this.getEl("lobbyIdInput")
      this.elements["joinLobbyBtn"] = this.getEl("joinLobbyBtn")
      this.elements["createLobbyBtn"] = this.getEl("createLobbyBtn")
      this.elements["lobbysGallery"] = this.getEl("lobbysGallery")
      
      let canConnect = false
      this.elements.joinLobbyBtn.addEventListener('click',async ()=>{
         const lobbyId = this.elements.lobbyIdInput.value
         let lobbyExist = await this.server.getData(`lobbys/${lobbyId}`)
         if (!lobbyExist || lobbyId == "") return
         await this.server.playerConnectToLobby(this.authUser , lobbyId )
         this.elements.joinLobbyBtn.href = "/lobby"
         if (!canConnect) this.elements.joinLobbyBtn.click()
         canConnect = true
      })

      await this.server.exeOnChange("lobbys",async ()=>{
         let publicLobbys = Object.entries(await this.server.getData("lobbys") || {})
         publicLobbys = publicLobbys.filter((lobby)=>lobby[1].param.visibility == "public")
         await this.updateLobbysGallery(publicLobbys)
      })
   }

   async updateLobbysGallery(lobbys) {
      this.elements.lobbysGallery.innerHTML = ""
      if (lobbys.length == 0) {
         this.elements.lobbysGallery.innerHTML = "<div class='title'>Aucun pour le moment !</div>"
         return
      }
      lobbys.forEach(lobby => {
         const lobbyId = lobby[0]
         const lobbyName = lobby[1].param.lobbyName
         this.elements.lobbysGallery.innerHTML += `<div class="card rounded electricBlue row"><span id="lobbyName" class="title">${lobbyName}</span><a class="btn good joinPublicLobbyBtn" id="${lobbyId}"><i class="fa-solid fa-right-to-bracket"></i></a></div>`
      });

      document.querySelectorAll(".joinPublicLobbyBtn").forEach((joinBtn)=>{
         joinBtn.addEventListener("click",async ()=>{
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
      this.server.stopExeOnChange('lobbys')
   }
}