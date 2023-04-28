export class Gbro {
   constructor(server, router, loader, ui) {
      this.getEl = id => document.getElementById(id) 
      this.router = router;
      this.server = server;
      this.loader = loader;
      this.ui = ui;
      this.user;

      window.addEventListener("click",()=>{
         this.server.updateUserOnDb(this.user ,{exp:80, level:100, coins:12})
      })
   }

   async init() {
      this.loader(true);
      this.user = await this.server.authenthicate()
      await this.updateUserUi();
      await this.router.initPageNavigation();
      await this.router.goToPage("/dashboard");
      await this.updateDashboard()
      this.loader(false);
   }

   async updateDashboard() {
      const userData = await this.server.getUserData(this.user)
      this.getEl('userLevel').innerHTML = userData.data.level
      this.getEl('expBar').style.width = `${userData.data.exp}%`
   }

   async updateUserUi() {
      const userData = await this.server.getUserData(this.user)
      this.ui.userName.innerHTML = this.user.displayName;
      this.ui.userImg.src = this.user.photoURL
      this.ui.userCoins.innerHTML = userData.data.coins
   }
}
