import { Router } from "./scripts/router.js";
import { authanticate } from "./server.js";
const getElById = id => document.getElementById(id)
const queryAll = identifier => document.querySelectorAll(identifier)


authanticate.then(result => {
    getElById("userImg").src = result.photoURL
    getElById("userName").innerHTML = result.displayName
    router.handleLocation("/home")
})
    
const router = new Router( 
    getElById("content") , 

    {404:"views/404.html" , 
     "/": "views/index.html",
     "/feur": "views/feur.html",
     "/home":"views/home.html"
    } 
)

router.handleLocation(location.pathname)

queryAll("a").forEach(link => {
    link.addEventListener('click', event => {
      router.pageNavigation( link , event)
    })
})

console.log("app.js executed");