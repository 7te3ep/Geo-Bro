import {googleAuth} from "../server.js"
const contentDiv = document.getElementById( 'content' )

// Fonction pour récupérer et injecter le contenu d'une page dans la div cible
function loadPage(url) {
  fetch(url)
    .then(response => response.text())
    .then(data => {
      contentDiv.innerHTML = data;
    })
    .catch(error => {
      console.error('Erreur de chargement de la page:', error);
    });
}
// Ajouter des événements de clic aux liens de navigation
const links = document.querySelectorAll('a');
links.forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault(); // Empêcher le lien de naviguer vers une nouvelle page
    const url = link.href;
    loadPage(link.href)
    //if (link.getAttribute("href") == './views/home/home.html') {
    //  document.querySelectorAll(".ui").forEach((item)=>{
    //    item.style.display = "none"
    //  })
    //  document.getElementById('ctaBtn').addEventListener("click",()=>{
    //    googleAuth()
    //  })
//
    //}else {
    //  document.querySelectorAll(".ui").forEach((item)=>{
    //    item.style.display = "flex"
    //  })
    //}
    history.pushState(null, '', url);
  });
});

class Router {
  constructor( contentDivId ){
    this.contentDiv = document.getElementById( contentDivId )
  }

  async getHtmlLink(){
    let links = document.querySelectorAll( 'a' );
    links.forEach(link => {
      handleLinkClick( link )
    });
  }

  async handleLinkClick( link ){
    link.addEventListener('click', event => {
      event.preventDefault();
      const url = link.href;
      history.pushState(null, '', url);
      this.loadPage( url )
    });
  }

  async loadPage( url ){
    try {
      const htmlData = await fetch(url).then(data => data.text())
      this.contentDiv.innerHTML = htmlData
    } catch ( error ){
      console.error( 'Erreur de chargement de la page:' , error );
    }
  }

}

console.log(window.location.pathname);