export class chooseGameMode {
   constructor(server , authUser, router){
      this.layer = 1 
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/chooseGameMode"
      this.path = "views/chooseGameMode.html"
      this.server = server
      this.authUser = authUser
      this.router = router
      this.canNav = true
      this.lobbyID
   }

   async update() {
  
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      await this.server.newLobbyOnDb(this.authUser)

      this.lobbyID = Object.entries(await this.server.getData(`hosts/${this.authUser.uid}`))[0][1]
      this.elements['playClassic'] = this.getEl('playClassic')
      this.elements['playSpeedrun'] = this.getEl('playSpeedrun')

      this.elements.playClassic.addEventListener('click',async ()=>{
         if (!this.canNav) return
         this.canNav = false
         await this.server.setData(`lobbys/${this.lobbyID}/param/gamemode`,'classic')
         this.elements.playClassic.href = "/chooseMap"
         this.elements.playClassic.click()
      })
   
      this.elements.playSpeedrun.addEventListener('click',async ()=>{
         if (!this.canNav) return
         this.canNav = false
         await this.server.setData(`lobbys/${this.lobbyID}/param/gamemode`,'speedrun')
         this.elements.playSpeedrun.href = "/chooseMap"
         this.elements.playSpeedrun.click()
      })

      await this.server.onDisconnectRemove(`lobbys/${this.lobbyID}`)
      await this.server.onDisconnectRemove(`hosts/${this.authUser.uid}`)
      await this.server.onDisconnectRemove(`replayStack/${this.authUser.uid}`)
   }

   async quit() {
      await this.server.removeData(`lobbys/${this.lobbyID}`)
      await this.server.removeData(`hosts/${this.authUser.uid}`)
   }
}