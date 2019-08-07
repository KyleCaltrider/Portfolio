export default () => {
    self.addEventListener('message', culture => {   // eslint-disable-line no-restricted-globals
        if (!culture) return;

        const circ = 2 * Math.PI;

        function distance(x1, x2, y1, y2) {
            return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2))
        }

        function findNucleus(cell) {
            const magnitude = -1 * cell.scale / 3,
                  Fx = magnitude * Math.cos(cell.heading),
                  Fy = magnitude * Math.sin(cell.heading),
                  x = Math.floor(cell.position[0] + Fx),
                  y = Math.floor(cell.position[1] - Fy);
            return [x, y];
        }

        function moveCell(cell, width, height) {
            if (Math.random() < (0.5)) cell.heading += (Math.random() * (0.8) - (0.4));
            if (cell.heading >= circ) cell.heading -= circ;
            if (cell.heading < 0) cell.heading = circ + cell.heading;
            let magnitude = Math.floor(Math.random() * 8),
            k         = 2 * cell.speed / cell.scale,
            Fx        = magnitude * Math.cos(cell.heading),
            Fy        = magnitude * Math.sin(cell.heading),
            x         = Math.floor(cell.position[0] + (Fx * k)),
            y         = Math.floor(cell.position[1] - (Fy * k));
            if ( x>20 && y>20 && x<(width-20) && y<(height-20) ) {
                cell["position"][0] = x;
                cell["position"][1] = y;
                cell.energy -= (magnitude / 10);
                cell.scale -= (magnitude / 100);
                if (cell.scale < 1) cell.scale = 1;
            }
            else {
                cell.heading += Math.PI;
                if (cell.heading > circ) cell.heading -= circ;
                moveCell(cell, width, height);
            }

            return cell;
        }






        let { cells, food, uv, canvasWidth, canvasHeight, foodCycle, foodAmount, cellsLimit } = culture.data;
        let updates = {},
            offspring = [];
        if (foodCycle === 0) {
            food = foodAmount;
            foodCycle = 20;
        }

        let newCells = cells.map( (cell, ic) => {
            // Move Cell
            cell.cyclesAlive++;
            cell.repCycle++;
            cell = moveCell(cell, canvasWidth, canvasHeight);

            // Calculate nucleus position
            cell['nucleus'] = findNucleus(cell);
            // Let Cell Eat
            if (Math.random() < food / 100) {
                cell.energy += 1;
                cell.scale += 0.1;
                if (cell.scale > 10) cell.scale = 10;
                if (cell.energy > 100) cell.energy = 100;
                food -= 0.1;
            }

            // Subject Cell To Mutations
            if (Math.random() < uv / 20000) {
                const rgb = Math.floor(Math.random() * 3);
                cell['color'][rgb] = Math.floor(Math.random() * 256);
                cell.color = cell.color.map(c => {
                    if (c > 255) c = 255;
                    return c;
                });
            }
            if (Math.random() < uv / 20000) {
                const rgb = Math.floor(Math.random() * 3);
                cell['nucleusColor'][rgb] = Math.floor(Math.random() * 256);
                cell.nucleusColor = cell.nucleusColor.map(c => {
                    if (c > 255) c = 255;
                    return c;
                });
            }

            // Let Cells Reproduce
            cells.forEach((mate , im) => {
                if (cells.length < cellsLimit &&
                    cell.id !== mate.id &&
                    im > ic &&
                    cell.repCycle > 100 &&
                    mate.repCycle > 100 &&
                    cell.energy > 50 &&
                    mate.energy > 50 &&
                    Math.random() > 0.5) {
                    const d = distance(cell.position[0], mate.position[0], cell.position[1], mate.position[1]);
                    if (d < (2*(cell.scale + mate.scale) + 5)) {
                        const newCell = {
                            id: [...Array(10)].map(_ => Math.floor(Math.random()*10)).join("") + cells.length,
                            energy: 50,
                            speed: Math.random() > 0.5 ? cell.speed : mate.speed,
                            scale: 5,
                            color: Math.random() > 0.5 ? cell.color : mate.color,
                            nucleusColor: Math.random() > 0.5 ? cell.nucleusColor : mate.nucleusColor,
                            cyclesAlive: 0,
                            repCycle: 0,
                            position: [Math.abs((cell.position[0] + mate.position[0]) / 2),
                                       Math.abs((cell.position[1] + mate.position[1]) / 2)],
                            heading: Math.random() * circ
                        }
                        cell.energy -= 30;
                        mate.energy -= 30;
                        cell.repCycle = 0;
                        mate.repCycle = 0;
                        newCell['nucleus'] = findNucleus(newCell);
                        offspring.push(newCell);
                    }
                }
            })
            
            return cell;
        })
        newCells = newCells.filter(cell => cell.energy > 0 && cell.cyclesAlive < 800);
        newCells = newCells.concat(offspring);
        updates["cells"] = newCells;
        updates["food"] = food;
        updates["foodCycle"] = foodCycle - 1;
        return postMessage(updates);
    });
};