export class Gbro {
   constructor(server , loader, ui) {
      this.getEl = id => document.getElementById(id) 
      this.server = server;
      this.loader = loader;
      this.currentView
      this.ui = ui;
      this.user;
   }

   async init() {
      this.loader(true);
      this.user = await this.server.authenthicate()
      await this.updateUserUi();
      this.loader(false);
   }

   async updateUserUi() {
      const userData = await this.server.getUserData(this.user)
      this.ui.userName.innerHTML = this.user.displayName;
      this.ui.userImg.src = this.user.photoURL
      this.ui.userCoins.innerHTML = userData.data.coins
   }
}