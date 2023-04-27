export class Gbro {
    constructor ( server , router , loader , ui ) {
        this.router = router
        this.server = server
        this.loader = loader
        this.ui = ui
        this.user
    }

    async init () {
        this.loader(true)
        await this.server.authentification.then((user)=>{
            this.updateUser(user)
        })
        await this.router.initPageNavigation()
        await this.router.goToPage("/dashboard")
        this.loader(false)
    }

    async updateUser(user){
        this.user = user 
        this.ui.userName.innerHTML = this.user.displayName
        this.ui.userImg.src = this.user.photoURL
    }

}