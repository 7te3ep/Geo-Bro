export class Router {
   constructor({ contentDiv }) {
      this.contentDiv = contentDiv;
   }

   async loadPage(link , path) {
      history.pushState(null, "", link);
      const html = await fetch(path).then((response) => response.text());
      this.contentDiv.innerHTML = html;

      document.querySelectorAll('div').forEach((div)=>{
         div.classList.add("opacityTrans");
      })
      document.querySelectorAll('.left-bottom,.left-top').forEach((div)=>{
         div.classList.add("leftTrans");
      })
      document.querySelectorAll('.right-bottom,.right-top').forEach((div)=>{
         div.classList.add("rightTrans");
      })
   }
}
