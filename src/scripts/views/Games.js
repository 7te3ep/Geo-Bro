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

      this.elements["lobbyIdInput"] = this.getEl("lobbyIdInput")
      this.elements["joinLobbyBtn"] = this.getEl("joinLobbyBtn")
      this.elements["createLobbyBtn"] = this.getEl("createLobbyBtn")
      
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
   }

   async quit() {

   }
}