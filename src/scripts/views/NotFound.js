export class NotFound {
   constructor(server , authUser, router){
      this.layer = 1 
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/404"
      this.path = "views/404.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {

   }


   async init() {
      await this.router.loadPage(this.link,this.path)
   }



   async quit() {  
   }
}