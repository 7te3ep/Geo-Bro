import {copyToClipboard} from "./copyToClipboard.js"
export class DashBoard {
   constructor(server, authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/dashboard"
      this.path = "views/dashboard.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      const userData = (await this.server.getUserData(this.authUser)).data
      this.elements.userLevel.innerHTML = userData.level
      this.elements.expBar.style.width = `${userData.exp}%`
      this.updateNewsGallery()
      this.updateShopGallery()
   }

   async init() {
         await this.router.loadPage(this.link,this.path)
         this.elements["userLevel"] = this.getEl('userLevel')
         this.elements["expBar"] = this.getEl('expBar')
         this.elements["newsGallery"] = this.getEl('newsGallery')
         this.elements["packGallery"] = this.getEl('packGallery')
   }

   async updateNewsGallery(){
      const newsOnDb = await this.server.getNews()
      const newsList = Object.entries(newsOnDb || {} )  
      this.elements.newsGallery.innerHTML = ""
      for (let news of newsList) {
         const newsTitle = news[0]
         const newsContent = news[1]
         const newsToShow = `<div class="container rounded electricBlue"><p class="title">${newsTitle}</p><p>${newsContent}</p></div>`
         this.elements.newsGallery.innerHTML += newsToShow
      }
   }

   async updateShopGallery(){
      const packsOnDb = await this.server.getShopPacks()
      const packList = Object.entries(packsOnDb || {} )  
      this.elements.packGallery.innerHTML = ""
      for (let pack of packList) {
         const packName = pack[0]
         const packType = pack[1].type
         const packArea = pack[1].area
         const packPrice = pack[1].price
         const packToShow = `<div class="card rounded dark"><p class="title">${packName}</p><p>Area: ${packArea}</p><p>Type:  ${packType}</p><p> ${packPrice}</p></div>`
         this.elements.packGallery.innerHTML += packToShow
      }
   }
}

export class Games {
   constructor(server, authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/games"
      this.path = "views/games.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      const userData = (await this.server.getUserData(this.authUser)).data
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
   }
}

export class Social {
   constructor(server , authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/social"
      this.path = "views/social.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      const userData = (await this.server.getUserData(this.authUser)).data
      this.elements.userID.innerHTML = userData.id
      this.updateFriendsList()
   }

   async updateFriendsList () {
      const userData = (await this.server.getUserData(this.authUser)).data
      const userFriends = Object.entries(userData.friends || {} )  
      this.elements.friendList.innerHTML = ""
      for (let friend of userFriends) {
         const friendUID = friend[0]
         const friendData = friend[1]
         const friendToShow = `<div class="card rounded light row"><span id="friendName">${friendData.name}</span><div class="btn good">Duel</div><div class="btn bad delFriendBtn" id="${friendUID}">X</div></div>`
         this.elements.friendList.innerHTML += friendToShow
      }

      document.querySelectorAll(".delFriendBtn").forEach((delBtn)=>{
         delBtn.addEventListener("click",async ()=>{
            const friendToDelID = delBtn.id
            this.server.delFriend(this.authUser ,friendToDelID)
            await this.update()
         })
      })
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      this.elements["addFriendInput"] = this.getEl("addFriendInput")
      this.elements["addFriendBtn"] = this.getEl("addFriendBtn")
      this.elements["userID"] = this.getEl("userID")
      this.elements["friendList"] = this.getEl("friendList")
      this.elements["copyToClipboardBtn"] = this.getEl("copyToClipboardBtn")
      
      this.elements.copyToClipboardBtn.addEventListener("click",()=>{
         copyToClipboard(this.elements.userID.innerHTML)
      })

      this.elements.addFriendBtn.addEventListener("click",async () => {
         await this.server.addFriend(this.authUser , this.elements.addFriendInput.value)
         this.elements.addFriendInput.value = ""
         await this.update()
      })
   }
}

export class CountryGame {
   constructor(server, authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/country"
      this.path = "views/countryGames.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      const userData = (await this.server.getUserData(this.authUser)).data
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      const width = window.innerWidth
      const height = window.innerHeight
      
      const projection = d3.geoOrthographic()
      .scale(200)
      .translate([width / 2, height / 3])
      .clipAngle(90) // sans cette option les pays de l'autre côté du globle sont visibles
      .precision(.1)
      .rotate([0,0,0]);
      
      const path = d3.geoPath()
        .projection(projection);
      
      const zoom = d3.zoom()
        .scaleExtent([0.2, 18])
        .on('zoom',() => g.attr('transform', d3.event.transform))
      
      const svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);
      
      const g = svg.append('g');
      
      svg.call(zoom);
      
      
      d3.json('../assets/countries.geo.json')
      .then(world => {
        g.selectAll('.country')
          .data(world.features)
          .enter().append('path')
          .attr("id", d => d.properties.name)
          .attr('class', 'country')
          .attr('d', path)
          .style("fill", function(){return "rgb("+Math.random()*255+","+Math.random()*255+","+Math.random()*255+")"})
          .on("click",(e)=>{
              pathClicked(e)
          });
      });
      
      let currentTouch = 0
      d3.zoom().filter(() => !d3.event.button)
      d3.select("svg").attr('id',"map").on("dblclick.zoom", null).on('mousedown.zoom',null).on('touchstart.zoom',null)
      // Désactive le zoom avec un double click
      
      const λ = d3.scaleLinear()
          .domain([0, width])
          .range([-180, 180]);
      
      const φ = d3.scaleLinear()
          .domain([0, height])
          .range([90, -90]);
      
      let  drag = d3.drag().subject(function() {
          var r = projection.rotate();
          return {
              x: λ.invert(r[0]),
              y: φ.invert(r[1])
          };
      }).on("drag", function(event) {
          projection.rotate([λ(d3.event.x), φ(d3.event.y)]);
          
          svg.selectAll(".country")
              .attr("d", path);
      })
      
      svg.call(drag);         
   }
}

