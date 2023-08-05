export class ChooseMap {
   constructor(server, authUser, router){
      this.layer = 1 
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/chooseMap"
      this.path = "views/chooseMap.html"
      this.server = server
      this.authUser = authUser
      this.router = router
      this.lobbyID
      this.canNav = true
   }

   async update() {

   }


   async init() {
      await this.router.loadPage(this.link,this.path)
      const hostData = await this.server.getData(`hosts/${this.authUser.uid}`)
      this.elements['playWorld'] = this.getEl('playWorld')
      this.elements['playUs'] = this.getEl('playUs')
      this.elements['playFr'] = this.getEl('playFr')
      this.lobbyID = hostData.id
      
      if (await this.server.getData(`users/${this.authUser.uid}/tuto`) == true){
         this.getEl('playWorld').classList.add('focus')
      }

      const playBtnClicked = async (el,map)=> {
         if (!this.canNav) return
         this.canNav = false
         await this.server.setData(`lobbys/${this.lobbyID}/param/map`,map)
         el.href = "/hostLobby"
         el.click()
      }

      this.elements.playWorld.addEventListener('click',async ()=>{
         playBtnClicked(this.elements.playWorld,"world")
      })

      this.elements.playUs.addEventListener('click',async ()=>{
         playBtnClicked(this.elements.playUs,"us")
      })

      this.elements.playFr.addEventListener('click',async ()=>{
         playBtnClicked(this.elements.playFr,"fr")
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