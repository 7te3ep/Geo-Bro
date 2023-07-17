export class Parameters {
   constructor(server , authUser, router){
      this.layer = 1 
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/parameters"
      this.path = "views/parameters.html"
      this.server = server
      this.authUser = authUser
      this.router = router
      this.canConnect = true
   }

   async update() {

   }


   async init() {
      await this.router.loadPage(this.link,this.path)

      this.elements["logoutBtn"] = this.getEl("logoutBtn")
      this.elements["userNameInput"] = this.getEl("userNameInput")
      this.elements["submitNameBtn"] = this.getEl("submitNameBtn")

      const currentUsername =  await this.server.getData(`users/${this.authUser.uid}/data/name`)
      const hasChanged = this.authUser.displayName != currentUsername
      if (hasChanged) this.elements.submitNameBtn.style.backgroundColor = "grey"

      this.elements.submitNameBtn.addEventListener('click',async ()=>{
         const proposalUsername = this.elements.userNameInput.value
         const correctLen = proposalUsername.length >= 4 && proposalUsername.length <= 10
         const hasSpecialChar = proposalUsername.match(/\W/)

         if (hasSpecialChar || !correctLen || hasChanged) return
         await this.server.setData(`users/${this.authUser.uid}/data/name`,proposalUsername)
      })

      this.elements.logoutBtn.addEventListener('click',async ()=>{
         if (!this.canConnect) return
         this.canConnect = false
         await this.server.signOut()
         this.elements.logoutBtn.href = "/entry"
         this.elements.logoutBtn.click()
      })
   }



   async quit() {  
   }
}