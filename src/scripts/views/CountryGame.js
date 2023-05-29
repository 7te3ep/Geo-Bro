export class CountryGame {
   constructor(server, authUser, router){
      this.lobbyID
      this.getEl = id => document.getElementById(id)
      this.elements = {}
      this.link = "/country"
      this.path = "views/countryGames.html"
      this.server = server
      this.authUser = authUser
      this.isHost = false
      this.router = router
   }

   async updateOnValue () {
      const gameExist = await this.server.getData(`lobbys/${this.lobbyID}`)
      console.log(this.lobbyID);
      if (!gameExist) this.getEl('navGames').click()
   }

   async update(){

   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      await this.hostConnectToLobby()
      if (!this.isHost) await this.findLobby()
      await this.server.exeOnChange(`lobbys/${this.lobbyID}`,()=>{return this.updateOnValue()})
      const width = window.innerWidth
      const height = window.innerHeight

      const projection = d3.geoMercator()
        .translate([width / 2, height / 2])
        .scale(width/5);

      const path = d3.geoPath()
        .projection(projection);

      const zoom = d3.zoom()
        .scaleExtent([1, 18])
        .on('zoom', ()=>g.attr('transform', d3.event.transform));

      const svg = d3.select('#content')
         .append('svg')
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

   d3.select("svg").attr('id',"map").on("dblclick.zoom", null); // Désactive le zoom avec un double click               
   }

   async hostConnectToLobby() {
      const hostDataPath = `hosts/${this.authUser.uid}`
      const hostData = await this.server.getData(hostDataPath)
      if (!hostData) return
      this.isHost = true
      this.lobbyID = hostData.id
      await this.server.setData(`lobbys/${this.lobbyID}/game/started`, true)
   }

   async findLobby() {
      const lobbys = Object.entries(await this.server.getData('lobbys'))
      for (let lobby of lobbys) {
         const lobbyID = lobby[0]
         const lobbyPlayers = Object.entries(lobby[1].players || {})
         for (let player of lobbyPlayers) {
            const isUserLobby = player[0] == this.authUser.uid
            if (isUserLobby) this.lobbyID = lobbyID
         }
      }
   }
   
   async deletePlayerOfLobby(playerUid){
      let playersOnLobby = await this.server.getData(`lobbys/${this.lobbyID}/players`)
      if (!playersOnLobby) return
      delete playersOnLobby[playerUid]
      this.server.setData(`lobbys/${this.lobbyID}/players`, playersOnLobby)
   }

   async quit() {
      if (this.isHost) {
         this.server.stopExeOnChange(`lobbys/${this.lobbyID}`)
         const lobbys = await this.server.getData("lobbys")
         const hosts = await this.server.getData("hosts")
         delete lobbys[this.lobbyID]
         delete hosts[this.authUser.uid]
         await this.server.setData("lobbys", lobbys)
         await this.server.setData("hosts", hosts)
      } else {
         this.server.stopExeOnChange(`lobbys/${this.lobbyID}`)
         await this.deletePlayerOfLobby(this.authUser.uid)
      }
   }
}