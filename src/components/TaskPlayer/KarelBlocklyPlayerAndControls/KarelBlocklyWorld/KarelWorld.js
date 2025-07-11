import _ from 'lodash'

const copy = data => _.cloneDeep(data)

function Karel(context) {
    const world = copy(context.world);
    if (!world.pickedStones) {
      world.pickedStones = { blue: 0, red: 0 };
    }
    this.world = world

    this.variables = {}
    this.eventFunctions = {}

    this.blue = 'blue'
    this.red = 'red'

    if (!world.karelRoom) {
      world.karelRoom = { row: 0, col: 0 };
    }

    const nextDir = {
      North: 'West',
      West: 'South',
      South: 'East',
      East: 'North'
    };

    const stonesAtLocation = (r, c, color, room) => world.stones.find(s => s.r === r && s.c === c && (s.color ? s.color === color : color === 'blue') && (s.room && room ? s.room.row === room.row && s.room.col === room.col : true))
    const wallAtLocation = (r, c, d) => world.walls.find(w => {
        //  equivalent wall location, but with West and South transformed to North and East
        const eq = {
            r: d === 'South' ? r + 1 : r,
            c: d === 'West' ? c - 1 : c,
            d: { West: 'East', South: 'North' }[d] || d
        }
        return w.r === eq.r && w.c === eq.c && w.d === eq.d
    })
    const stonesUnderAgent = (color) => {
      if (context.currentId === 0) {
        return stonesAtLocation(world.karelRow, world.karelCol, color, world.karelRoom)
      } else if (context.currentId > 0) {
        const id = context.currentId
        return stonesAtLocation(world.agents[id].row, world.agents[id].col, color, world.agents[id].room)
      } else {
        this.error = 'Checked stones not under agent!'
      }
    }

    this.move = () => {
        if (context.currentId === 0) {
            if (!this.frontIsClear(world.karelRow, world.karelCol, world.karelDir, world.karelRoom)) {
              this.error = 'Front is blocked!';
            }
            else if (world.karelDir === 'North') world.karelRow -= 1
            else if (world.karelDir === 'South') world.karelRow += 1
            else if (world.karelDir === 'East') world.karelCol += 1
            else if (world.karelDir === 'West') world.karelCol -= 1

            if (world.karelRow < 0) {
                world.karelRow = world.nRows - 1
                world.karelRoom.row -= 1
            }
            if (world.karelRow >= world.nRows) {
                world.karelRow = 0
                world.karelRoom.row += 1
            }
            if (world.karelCol < 0) {
                world.karelCol = world.nCols - 1
                world.karelRoom.col -= 1
            }
            if (world.karelCol >= world.nCols) {
                world.karelCol = 0
                world.karelRoom.col += 1
            }
        } else {
          const id = context.currentId;

          if (!this.frontIsClear(world.agents[id].row, world.agents[id].col, world.agents[id].dir, world.agents[id].room)) {
            this.error = 'Front is blocked!';
          }
          else if (world.agents[id].dir === 'North') {
            world.agents[id].row -= 1;
          }
          else if (world.agents[id].dir === 'South') {
            world.agents[id].row += 1;
          }
          else if (world.agents[id].dir === 'East') {
            world.agents[id].col += 1;
          }
          else if (world.agents[id].dir === 'West') {
            world.agents[id].col -= 1;
          }

          if (world.agents[id].row < 0) {
              world.agents[id].row = world.nRows - 1;
              world.agents[id].room.row--;
          }
          if (world.agents[id].row >= world.nRows) {
              world.agents[id].row = 0;
              world.agents[id].room.row++;
          }
          if (world.agents[id].col < 0) {
              world.agents[id].col = world.nCols - 1;
              world.agents[id].room.col--;
          }
          if (world.agents[id].col >= world.nCols) {
              world.agents[id].col = 0;
              world.agents[id].room.col++;
          }
        }
    }

    this.bounce = () => {
      if (!world.agents || Object.keys(world.agents).length === 0) {
        throw new Error("Used bounce without agents");
      }

      const id = context.currentId;

      if (!this.frontIsClear(world.agents[id].row, world.agents[id].col, world.agents[id].dir, world.agents[id].room)) {
        world.agents[id].dir = nextDir[nextDir[world.agents[id].dir]];
      }

      if (world.agents[id].dir === 'West' && world.nCols > 1) {
        --world.agents[id].col;
      } else if (world.agents[id].dir === 'East' && world.nCols > 1) {
        ++world.agents[id].col;
      } else if (world.agents[id].dir === 'North' && world.nRows > 1) {
        --world.agents[id].row;
      } else if (world.agents[id].dir === 'South' && world.nRows > 1) {
        ++world.agents[id].row;
      }
    }

    this.turnLeft = () => {
      if (context.currentId === 0) {
        world.karelDir = nextDir[world.karelDir];
      } else {
        world.agents[context.currentId].dir = nextDir[world.agents[context.currentId].dir];
      }
    }

    this.pickStone = (color) => {
        if (!this.stonesPresent(color)) this.error = 'No ' + color + ' stones to pick!'
        else {
            world.pickedStones[color] += 1
            stonesUnderAgent(color).n -= 1
            // don't allow stones when n < 1
            world.stones = world.stones.filter(s => s.n > 0)
        }
    }

    this.placeStone = (color) => {
        if (world.pickedStones[color] === 0) this.error = 'Karel has no ' + color + ' stones to place!'
        else {
            world.pickedStones[color] -= 1
            const stones = stonesUnderAgent(color)
            if (!stones) world.stones.push({ r: world.karelRow, c: world.karelCol, n: 1, color, room: {...world.karelRoom} })
            else stones.n += 1
        }
    }

    this.spawnStone = (color, row, column, room) => {
        row = row - 1
        column = column - 1
        if (!color) color = 'blue'
        if (!room) room = world.karelRoom
        if (row < 0 || row >= world.nRows) this.error = 'Row out of bounds!'
        else if (column < 0 || column >= world.nCols) this.error = 'Column out of bounds!'
        else {
            const stones = stonesAtLocation(row, column, color, room)
            if (!stones) world.stones.push({ r: row, c: column, n: 1, color, room })
            else stones.n += 1
        }
    }

    this.frontIsClear = (r, c, d, room) => {
        if (!r) {
          r = context.currentId > 0 ? world.agents[context.currentId].row : world.karelRow
        }
        if (!c) {
          c = context.currentId > 0 ? world.agents[context.currentId].col : world.karelCol
        }
        if (!d) {
          d = context.currentId > 0 ? world.agents[context.currentId].dir : world.karelDir
        }
        if (!room) {
          room = context.currentId > 0 ? world.agents[context.currentId].room : world.karelRoom
        }

        if (d === 'South' && r === world.nRows - 1) {
          if (world.doors && world.doors.find(door => door.r === world.nRows && door.c === c && door.d === 'North' && door.room.row === room.row && door.room.col === room.col)) {
            return true
          }

          return false
        }
        if (d === 'East' && c === world.nCols - 1) {
          if (world.doors && world.doors.find(door => door.r === r && door.c === world.nCols && door.d === 'East' && door.room.row === room.row && door.room.col === room.col)) {
            return true
          }

          return false
        }
        if (d === 'North' && r === 0) {
          if (world.doors && world.doors.find(door => door.r === 0 && door.c === c && door.d === 'North' && door.room.row === room.row && door.room.col === room.col)) {
            return true
          }

          return false
        }
        if (d === 'West' && c === 0) {
          if (world.doors && world.doors.find(door => door.r === r && door.c === 0 && door.d === 'East' && door.room.row === room.row && door.room.col === room.col)) {
            return true
          }

          return false
        }
        return !wallAtLocation(r, c, d)
    }

    this.noObstacle = () => {
      if (context.currentId === 0) {
        return this.frontIsClear(world.karelRow, world.karelCol, world.karelDir, world.karelRoom)
      } else if (context.currentId > 0) {
        const id = context.currentId
        return stonesAtLocation(world.agents[id].row, world.agents[id].col, world.agents[id].dir, world.agents[id].room)
      } else {
        this.error = 'Checked obstacle not for agent!'
      }
    }

    this.stonesPresent = (color) => !!stonesUnderAgent(color)

    this.random = (a, b) => {
      return Math.floor(Math.random() * (b - a + 1) + a);
    }

    this.karelStoneCount = (color) => {
      return world.pickedStones[color];
    }

    this.worldStoneCount = (color) => {
      return world.stones.filter(stone => stone.color === color).reduce((acc, stone) => acc + stone.n, 0);
    }

    this.checkCollision = () => {
      for (const agentId in world.agents) {
        if (
          world.karelRoom.row === world.agents[agentId].room.row &&
          world.karelRoom.col === world.agents[agentId].room.col &&
          world.karelRow === world.agents[agentId].row &&
          world.karelCol === world.agents[agentId].col
        )
        {
          return true;
        }
      }
      return false;
    }

    this.error = null

    return this
}

export default function KarelWorld(world, source, highlight, directions) {
    const steps = [copy({
        openBlocks: {},
        world,
        error: null,
        isDone: false,
        step: 0,
        pythonText: ''
    })]
    let finalStep = Infinity

    //  TODO: validate world
    const openBlocks = {}
    const startBlock = id => openBlocks[id] = openBlocks[id] ? openBlocks[id] + 1 : 1
    const endBlock = id => openBlocks[id] -= 1
    const done = () => finalStep = steps.length //  this is called before the last step is added to steps since our implementation looks to the step ahead

    let textAccumulator = '';
    const appendText = text => textAccumulator += text;

    const context = {
      world,
      currentId: 0
    };
    if (world.endConditions) {
      context.currentId = -1
    } else if (world.agents && Object.keys(world.agents).length > 0) {
      context.currentId = parseInt(Object.keys(world.agents)[0])
    }

    const resolveCurrentPromise = {0: []}
    if (world.endConditions) {
      resolveCurrentPromise[-1] = []
    }
    if (world.agents && Object.keys(world.agents).length > 0)
    {
      for (const agentId of Object.keys(world.agents)) {
        resolveCurrentPromise[agentId] = []
      }
    }
    const step = (i) => new Promise(resolve => resolveCurrentPromise[i ?? context.currentId].push(resolve))

    const karel = new Karel(context);

    // Expose karel for variable inspector
    this.karel = karel

    //  functions is expected to be an object with keys corresponding to properly named
    //  async function definitions
    const runner = new Function('karel', 'start_block', 'end_block', 'step', 'done', 'highlight', 'appendText', 'directions', source)

    //  start runner, will execute first step so that state is ready for the caller
    runner(karel, startBlock, endBlock, step, done, highlight, appendText, directions)

    this.step = async (index) => {
        // return previously computed step
        if (steps[index]) return steps[index]

        if (index > steps.length) throw Error('New steps must be called for sequentialy')
        if (index > finalStep) throw Error('Cannot get step after the program has concluded')
        if (steps[steps.length - 1].error) throw Error('Cannot get step after an error!')

        const currentKarelWorldState = copy({
            openBlocks,
            activeBlocks: Object.keys(openBlocks).filter(k => openBlocks[k] > 0),
            world: karel.world,
            error: karel.error,
            isDone: karel.world.endConditions ? await karel.world.endConditions(karel) : finalStep === index,
            step: index,
            pythonText: textAccumulator,
            currentId: context.currentId
        })

        if ((world.agents && Object.keys(world.agents).length > 0) || world.endConditions) {
          const agentIds = Object.keys(world.agents).map(k => parseInt(k))

          if (context.currentId === 0) {
            context.currentId = world.endConditions ? -1 : agentIds[0]
          } else if (context.currentId === -1) {
            context.currentId = (world.agents && Object.keys(world.agents).length > 0) ? agentIds[0] : 0
          } else {
            for (let i = 0; i < agentIds.length; i++) {
              if (context.currentId === agentIds[i] && i < agentIds.length - 1) {
                context.currentId = agentIds[i + 1]
                break
              } else if (context.currentId === agentIds[i] && i === agentIds.length - 1) {
                context.currentId = 0
                break
              }
            }
          }
        }

        //  resolve current promise so the next KarelWorldState is ready for next call to step
        for (const resolve of resolveCurrentPromise[context.currentId]) resolve()
        resolveCurrentPromise[context.currentId] = []

        steps[index] = currentKarelWorldState

        if (context.currentId === 0) {
          if ('ArrowLeft' in karel.eventFunctions && !karel.eventFunctions.ArrowLeft.called && directions[1]) {
              karel.eventFunctions.ArrowLeft.called = true
              karel.eventFunctions.ArrowLeft.f()
          }
          if ('ArrowRight' in karel.eventFunctions && !karel.eventFunctions.ArrowRight.called && directions[3]) {
              karel.eventFunctions.ArrowRight.called = true
              karel.eventFunctions.ArrowRight.f()
          }
          if ('ArrowUp' in karel.eventFunctions && !karel.eventFunctions.ArrowUp.called && directions[0]) {
              karel.eventFunctions.ArrowUp.called = true
              karel.eventFunctions.ArrowUp.f()
          }
          if ('ArrowDown' in karel.eventFunctions && !karel.eventFunctions.ArrowDown.called && directions[2]) {
              karel.eventFunctions.ArrowDown.called = true
              karel.eventFunctions.ArrowDown.f()
          }
        }

        if (!('ArrowUp' in karel.eventFunctions)) {
          directions[0] = false;
        }
        if (!('ArrowLeft' in karel.eventFunctions)) {
          directions[1] = false;
        }
        if (!('ArrowDown' in karel.eventFunctions)) {
          directions[2] = false;
        }
        if (!('ArrowRight' in karel.eventFunctions)) {
          directions[3] = false;
        }

        return currentKarelWorldState
    }

    return this
}