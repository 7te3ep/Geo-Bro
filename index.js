import { Gbro } from './scripts/Gbro.js'
import { Router } from './scripts/Router.js'
import { Server } from './scripts/Server.js'
import { loader } from './scripts/loader.js'


const geoBro = new Gbro(
    new Server(),
    new Router (
        {
            contentDiv: document.getElementById('content'),
            routes:  {
                404:"views/404.html" ,
                "/dashboard": "views/dashboard.html",
                "/games": "views/games.html",
                "/home":"views/home.html"
            },
           loader : loader
        }
    ),
    loader, 
    {
        userName: document.getElementById('userName'),
        userImg: document.getElementById('userImg')
    }
)

geoBro.init()
