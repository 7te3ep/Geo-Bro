import { Router } from "./scripts/router.js";
import { authanticate , getUser } from "./server.js";
const getElById = id => document.getElementById(id)
const queryAll = identifier => document.querySelectorAll(identifier)
const loader = visibility => document.querySelector(".loader").style.display = visibility ? "flex" : "none"

loader(true)
authanticate.then(result => {
    getElById("userImg").src = result.photoURL
    getElById("userName").innerHTML = result.displayName
    router.goToPage("/dashboard")
})
    
const router = new Router( 
    getElById("content") , 

    {404:"views/404.html" , 
     "/dashboard": "views/dashboard.html",
     "/games": "views/games.html",
     "/home":"views/home.html"
    },
    loader
)

queryAll("a").forEach(link => {
    link.addEventListener('click', event => {
        console.log(getUser())
        router.pageNavigation( link , event)
    })
})
