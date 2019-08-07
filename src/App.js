import React from 'react';
import { animateScroll as scroll } from 'react-scroll';
import './App.css';

import WebWorker from './WebWorker';
import CellWorker from './CellWorker';


const works = [
  {
    name: "Facial Recognition Demo",
    description: "Python, React, & MongoDB powered facial recognition app. Train a user-unique system to recognize faces within a photo.",
    code: <a href="">Code</a>,
    live: <a href="">Live</a>,
    image: <img src="" />
  },
  {
    name: "Parent2PI",
    description: "React, Node, Paypal, & MongoDB powered booking/customer outreach app for Parenting To Promote Independence &trade;",
    code: <a href="">Code</a>,
    live: <a href="">Live</a>,
    image: <img src="" />
  },
  {
    name: "React Etsy Store",
    description: "React, Node, Etsy, & MongoDB powered custom Etsy storefront.",
    code: <a href="">Code</a>,
    live: <a href="">Live</a>,
    image: <img src="" />
  }
];


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      canvas: null,
      ctx: null,
      cells: [],
      food: null,
      foodAmount: 100,
      foodCycle: 30,
      uv: 10,
      cellCount: null,
      simSpeed: 50,
      cellsLimit: null,
      hovers: {bannerArrow: false}
    }
    this.worker = new WebWorker(CellWorker);

    this.updateSimulation = this.updateSimulation.bind(this);
    this.updateCanvas = this.updateCanvas.bind(this);
    this.handleCanvasClick = this.handleCanvasClick.bind(this);
    this.toggleHover = this.toggleHover.bind(this);
  }

  componentDidMount() {
    this.initCanvas();
  }

  componentWillUnmount() {
    clearInterval(this.state.timer);
    this.worker.terminate();
  }

  initCanvas() {
    const canvas = this.refs['canvas'],
          ctx    = canvas.getContext('2d');
    
    this.setState({
      ctx: ctx,
      canvas: canvas,
      timer: setInterval(this.updateSimulation, this.state.simSpeed),
      cells: this.seedCells(this.state.cellCount, canvas.width, canvas.height),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      food: this.state.foodAmount,
      cellCount: Math.floor((canvas.width * canvas.height) / 80000),
      cellsLimit: Math.floor((canvas.width * canvas.height) / 5000)
    });

    // Worker Listener
    this.worker.addEventListener('message', updates => {
      if (!updates) return;
      updates = updates.data;
      this.setState(updates);
      this.updateCanvas(updates);
      if (updates.cells.length === 0) this.setState({cells: this.seedCells(this.state.cellCount, canvas.width, canvas.height)});
    })
  }

  updateSimulation() {
    const culture = {
      food: this.state.food,
      cells: this.state.cells,
      uv: this.state.uv,
      canvasWidth: this.state.canvasWidth,
      canvasHeight: this.state.canvasHeight,
      foodCycle: this.state.foodCycle,
      foodAmount: this.state.foodAmount,
      cellsLimit: this.state.cellsLimit
    }

    this.worker.postMessage(culture);
  }

  updateCanvas(updates) {
    const { ctx, canvas } = this.state;
    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
        
    // Draw Background

    // Lamp
    const lamp = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height) * 0.5);
    lamp.addColorStop(0, "rgba(255, 255, 0, 0.05)");
    lamp.addColorStop(1, "rgba(0, 0, 0, 0.05)");
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Hemocytometer grid
    const startX = (canvas.width / 2),
          startY = (canvas.height / 2),
          gapWidth = Math.min(startX, startY) / 6; 
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    for (let o = 0; o < 2; o++) {
      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = i === 4 ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)";  
        if (o === 0) {
          const da = startX + gapWidth * i,
                db = startX - gapWidth * i;
          ctx.beginPath();
          ctx.moveTo(da, 0);
          ctx.lineTo(da, canvas.height);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(db, 0);
          ctx.lineTo(db, canvas.height);
          ctx.stroke();
        }
        else {
          const da = startY + gapWidth * i,
                db = startY - gapWidth * i;
          ctx.beginPath();
          ctx.moveTo(0, da);
          ctx.lineTo(canvas.width, da);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, db);
          ctx.lineTo(canvas.width, db);
          ctx.stroke();
        }
      }
    }

    // Draw Cells
    updates.cells.forEach(cell => {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)"

      // Cell
      ctx.beginPath();
      ctx.arc(cell.position[0], cell.position[1], cell.scale * 2, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${cell.color[0]}, ${cell.color[1]}, ${cell.color[2]}, 0.8)`;
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
      // Nucleus
      ctx.beginPath();
      ctx.arc(cell.nucleus[0], cell.nucleus[1], cell.scale / 2, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${cell.nucleusColor[0]}, ${cell.nucleusColor[1]}, ${cell.nucleusColor[2]}, 0.7)`;
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    })
  }

  seedCells(quantity, width, height) {
    const randomCoordinates = () => {
      let x = Math.floor(Math.random() * ((width - 20) - 20) + 20),
          y = Math.floor(Math.random() * ((height - 20) - 20) + 20);
      return [x, y];
    }
    let cells = [];
    for (let i = 0; i < quantity; i++) {
      const cell = {
        energy: 50,
        speed: Math.floor(Math.random() * (7 - 3) + 3),
        scale: 5,
        color: [...Array(3)].map(_ => Math.floor(Math.random() * 266)),   // [255, 70, 144],
        nucleusColor: [...Array(3)].map(_ => Math.floor(Math.random() * 266)),
        cyclesAlive: 0,
        repCycle: 0,
        position: randomCoordinates(),
        heading: Math.random() * 2 * Math.PI,
        id: [...Array(10)].map(_ => Math.floor(Math.random()*10)).join("") + i
      };
      cells.push(cell);
    }
    return cells;
  }

  handleCanvasClick(e) {
   const ne        = e.nativeEvent,
         pos       = [ne.offsetX, ne.offsetY],
         { cells } = this.state;
   this.setState({
     cells: cells.filter(c => distance(c.position[0], pos[0], c.position[1], pos[1]) > c.scale * 3)
   });

  }

  toggleHover(key) {
    const { hovers } = this.state;
    hovers[key] = !hovers[key];
    console.log(hovers);
    this.setState(hovers);
  }

  render() {
    return (
      <div className="App" >

        <div id="banner-container" >
          <div id="banner" >Hello, I'm Kyle</div>
          <div className="arrow-down" onMouseEnter={() => this.toggleHover("bannerArrow")}
              onMouseLeave={() => this.toggleHover("bannerArrow")}
              onClick={() => scroll.scrollTo(1000)} >
            <div className={"arrowL " + (this.state.hovers.bannerArrow ? "hover" : "")} />
            <div className={"arrowR " + (this.state.hovers.bannerArrow ? "hover" : "")} />
          </div>
        </div>

        <div id="about-me">
          A full-stack web developer and scientist.
          I am passionate about designing web applications.
          Biology is another passion of mine, as such I hope you enjoy the Cell Simulation.
          Below you can find some of my strengths and other works.
        </div>

        <div id="strengths">
            Icons!!!
        </div>

        <div id="works">
            {works.map(work => {
              return(
              <div className="work">
                <h2>{work.name}</h2>
                {work.image}
                <p>{work.description}</p>
                {work.live}
                {work.code}
              </div>
              )
            })}
        </div>

        <div id="resume">
        </div>

        <div id="simulation-container" >
          <canvas ref="canvas"
                  width={window.innerWidth}
                  height={window.innerHeight}
                  onClick={this.handleCanvasClick} />
        </div>

      </div>
    );
  }
}

function distance(x1, x2, y1, y2) {
  return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2))
}


export default App;
