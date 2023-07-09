export class Entry {
   constructor(server , authUser, router){
      this.layer = 1 
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/entry"
      this.path = "views/entry.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {

   }


   async init() {
      await this.router.loadPage(this.link,this.path)
      this.getEl("botNav").style.display = "none" 
      this.elements['playBtn'] = this.getEl('playBtn')
      this.elements['socialGallery'] = this.getEl('socialGallery')

      this.elements.playBtn.addEventListener('click',(event)=>{
         this.elements.playBtn.classList.add('disapear')
         this.elements.playBtn.style.display = 'none'
         this.elements.socialGallery.style.display = 'flex'
         this.elements.socialGallery.classList.add('appear')
      })

   }



   async quit() { 
      this.getEl("botNav").style.display = "flex" 
   }
}