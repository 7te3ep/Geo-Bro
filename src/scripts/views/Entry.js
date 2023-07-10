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
      this.elements['google'] = this.getEl('google')
      this.elements['twitter'] = this.getEl('twitter')
      this.elements['facebook'] = this.getEl('facebook')
      this.elements['microsoft'] = this.getEl('microsoft')
      this.elements['entrance'] = this.getEl('entrance')
      this.elements.playBtn.addEventListener('click',(event)=>{
         this.elements.playBtn.classList.add('disapear')
         this.elements.playBtn.style.display = 'none'
         this.elements.socialGallery.style.display = 'flex'
         this.elements.socialGallery.classList.add('appear')
      })

      this.elements.google.addEventListener('click',async ()=>{
         await this.server.authenticate(false, 'google')
         this.elements.entrance.click()
      })
      this.elements.twitter.addEventListener('click',async ()=>{
         await this.server.authenticate(false, 'twitter')
         this.elements.entrance.click()
      })

      this.elements.facebook.addEventListener('click',async ()=>{
         await this.server.authenticate(false, 'facebook')
         this.elements.entrance.click()
      })

      this.elements.microsoft.addEventListener('click',async ()=>{
         await this.server.authenticate(false, 'microsoft')
         this.elements.entrance.click()
      })
      //await this.server.authenthicate();
   }



   async quit() { 
      this.getEl("botNav").style.display = "flex" 
   }
}