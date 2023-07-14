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
         this.elements.playClassic.href = "/hostLobby"
         this.elements.playClassic.click()
      })
   
      this.elements.playSpeedrun.addEventListener('click',async ()=>{
         if (!this.canNav) return
         this.canNav = false
         await this.server.setData(`lobbys/${this.lobbyID}/param/gamemode`,'speedrun')
         this.elements.playSpeedrun.href = "/hostLobby"
         this.elements.playSpeedrun.click()
      })
   }

   async quit() {
      console.log(this.lobbyID);  
      console.log(this.authUser);  
      await this.server.removeData(`lobbys/${this.lobbyID}`)
      await this.server.removeData(`hosts/${this.authUser.uid}`)
   }
}