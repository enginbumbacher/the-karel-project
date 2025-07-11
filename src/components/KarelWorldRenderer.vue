<template>
    <svg
      :viewBox="`0 0 ${viewBoxW} ${viewBoxH}`"
      style="overflow: hidden;"
      preserveAspectRatio="xMinYMin meet"
    >
        <!-- WORLD BORDER -- top-left top-right bottom-right bottom-left close. Path positioned just inside viewBox for no cutoff-->
        <path
            :d="`M${borderWidth/2},${borderWidth/2} 
                ${viewBoxW-borderWidth/2},${borderWidth/2} 
                ${viewBoxW-borderWidth/2},${viewBoxH-borderWidth/2} 
                ${borderWidth/2},${viewBoxH-borderWidth/2} 
                z
            `"
            fill="none"
            stroke="black"
            :stroke-width="borderWidth"
        />

        <!-- BOX CENTER MARKERS -->
        <template v-for="(x,r) in world.nRows">
          <path
            v-for="(y,c) in world.nCols"
            :key="`marker-${r}-${c}`"
            d="M 5 5 l -0.5 0 l 1 0 l -0.5 0 l 0 0.5 l 0 -1" stroke="black" stroke-width="0.2"
            :style="`transform: translate(${100*c/world.nCols}%, ${100*r/world.nRows}%);`"
          />
        </template>

        <!-- STONES -->
        <g
            v-for="stone in finalStones"
            :key="`stones-${stone.color}-${stone.room.row}-${stone.room.col}-${stone.r}-${stone.c}`"
            :style="`
                transform: translate(${
                    100*(stone.c + (stone.multi ? (stone.color === 'blue' ? -0.1 : 0.35) : 0))/world.nCols
                }%, ${
                    100*(stone.r + (stone.multi ? 0.125 : 0))/world.nRows
                }%) ${
                    stone.multi ? 'scale(0.75)' : ''
                } 
            `"
        >
            <path v-if="stone.n > 0"
                d="M 5 2 l 3 3 l -3 3 l -3 -3 z"
                :fill="stone.color"
            />
            <path v-else
                d="M 5 2 l 3 3 l -3 3 l -3 -3 z"
                :stroke="stone.color"
                stroke-width="0.2"
                stroke-dasharray="1,1"
                fill="white"
            />
            <text v-if="stone.n > 0"
                x="5" y="5"
                font-size="1.85"
                fill="white"
                font-family="Tahoma"
                dominant-baseline="middle"
                text-anchor="middle"
            >{{ stone.n }}/{{ stone.obj }} </text>
            <text v-else
                x="5" y="5"
                font-size="1.85"
                fill="black"
                font-family="Tahoma"
                dominant-baseline="middle"
                text-anchor="middle"
            >{{ stone.n }}/{{ stone.obj }} </text>
        </g>

        <!-- WALLS -->
        <line v-for="wall in eastWalls" :key="`east-wall-${wall.r}-${wall.c}`"
            :x1="(wall.c + 1) * 10"
            :y1="wall.r * 10"
            :x2="(wall.c + 1) * 10"
            :y2="(wall.r + 1) * 10"
            stroke="black"
            stroke-width="0.2"
        />
        <line v-for="wall in northWalls" :key="`north-wall-${wall.r}-${wall.c}`"
            :x1="wall.c * 10"
            :y1="wall.r * 10"
            :x2="(wall.c + 1) * 10"
            :y2="wall.r * 10"
            stroke="black"
            stroke-width="0.2"
        />

        <!-- DOORS -->
        <line v-for="door in eastDoors" :key="`east-door-${door.r}-${door.c}`"
          :x1="door.c * 10"
          :y1="door.r * 10"
          :x2="door.c * 10"
          :y2="(door.r + 1) * 10"
          stroke="white"
          :stroke-width="borderWidth * 2"
        />
        <line v-for="door in northDoors" :key="`north-door-${door.r}-${door.c}`"
          :x1="door.c * 10"
          :y1="door.r * 10"
          :x2="(door.c + 1) * 10"
          :y2="door.r * 10"
          stroke="white"
          :stroke-width="borderWidth * 2"
        />

        <!-- AGENTS -->
        <SvgPositioner v-for="agent, id in finalAgents"
          :key="`agent-${id}`"
          anchor="center center"
          :xPos="5 + 10*agent.col"
          :yPos="5 + 10*agent.row"
          :w="7.5"
          :rotation="agentRotation(agent.dir)"
        >
          <StoneAndNumber :n="-1" :obj="-1" :color="agent.color" :numPosition="'middle'" />
        </SvgPositioner>

        <!-- KAREL -->
        <SvgPositioner
          v-if="(world.karelRoom?.row ?? 0) === activeRoom.row && (world.karelRoom?.col ?? 0) === activeRoom.col"
          :xPos="5 + 10*world.karelCol"
          :yPos="5 + 10*world.karelRow"
          :w="5"
          anchor="center center"
          :rotation="rotation"
        >
          <KarelVueSvg />
        </SvgPositioner>

        <!-- OBJECTIVE KAREL -->
        <SvgPositioner
          v-if="(objective.karelRoom?.row ?? 0) === activeRoom.row && (objective.karelRoom?.col ?? 0) === activeRoom.col"
          :xPos="5 + 10*objective.karelCol"
          :yPos="5 + 10*objective.karelRow"
          :w="5"
          anchor="center center"
          :rotation="objectiveRotation"
          :opacity="0.5"
        >
          <KarelVueSvg />
        </SvgPositioner>
      
        <!-- BOX CLICK AREAS -->
        <!-- There's a pain that svg doesn't allow for click that i know of
        for events to fire on multiple, overlapping elements.  For example, to 
        handle a click for a stone and karel, or a stone and a cell,
        simultaneously.  The simplest path is to emit what cell was clicked
        on and let the outside context figure out if there is a karel there,
        or a stone, or whatever it wants to do with it.  That still leaves
        the problem of the nearest wall.  So, I decided on a not so pretty
        (but functional) approach to cut the cells up into trianges, and the
        click event will emit the cell AND the nearest wall (depending on
        which region of that cell was clicked).
        -->
        <template v-for="(x,r) in world.nRows" >
            <g v-for="(y,c) in world.nCols" :key="`box-${r}-${c}`">
                <path class="top-tri-region" fill="transparent"
                :d="`M${10*c},${10*r} l 10,0 l -5,5 z`"
                @click="handleClick(r,c,'top')"
                />
                <path class="bottom-tri-region" fill="transparent"
                :d="`M${10*c},${10+10*r} l 10,0 l -5,-5 z`"
                @click="handleClick(r,c,'bot')"
                />
                <path class="left-tri-region" fill="transparent"
                :d="`M${10*c},${10*r} l 5,5 l -5,5 z`"
                @click="handleClick(r,c,'left')"
                />
                <path class="right-tri-region" fill="transparent"
                :d="`M${10+10*c},${10*r} l -5,5 l 5,5 z`"
                @click="handleClick(r,c,'right')"
                />
            </g>
        </template>
    </svg>

</template>

<script>
import SvgPositioner from './SvgPositioner.vue'
import KarelVueSvg from '../assets/KarelVueSvg.vue'
import StoneAndNumber from './BuilderComponents/TaskCustomizer/KarelWorldRendererAndEditor/StoneAndNumberVueSvg.vue';
export default {
  components: { SvgPositioner, KarelVueSvg, StoneAndNumber },
  props: {
    borderWidth: {
      type: Number,
      required: false,
      default: 0.35,
    },
    world: {
      type: Object,
      default: () => ({
        "nRows": 3,
        "nCols": 3,
        "stones": [{ "r": 0, "c": 0, "n": 1, "color": "blue", "room": {"row": 0, "col": 0} }],
        "pickedStones": { "blue": 0, "red": 0 },
        "walls": [],
        "doors": [],
        "rooms": [],
        "karelDir": "East",
        "karelRow": 2,
        "karelCol": 0,
        "karelRoom": {row: 0, col: 0},
        "agents": []
      })
    },
    objective: {
      type: Object,
      default: () => ({
        "nRows": 3,
        "nCols": 3,
        "stones": [{ "r": 0, "c": 0, "n": 1, "color": "blue", "room": {"row": 0, "col": 0} }],
        "pickedStones": { "blue": 0, "red": 0 },
        "walls": [],
        "doors": [],
        "rooms": [],
        "karelDir": "East",
        "karelRow": 2,
        "karelCol": 0
      })
    },
    activeRoom: {
      type: Object,
      default: () => ({
        row: 0,
        col: 0
      })
    }
  },
  methods: {
    handleClick(r,c,region) {
      // in the karel world json standard, walls are only North or East,
      // north wall cannot be present on 0th row
      // east  wall cannot be present on final column
      // possibly the logic that outputs/format the 'nearest
      // wall' to fit that karel world schema could live elsewhere... but whatever
      let wall;
      const { nRows, nCols } = this.world
      if (region === 'top' && r !== 0) {
        wall = { r, c, d: 'North' }
      } else if (region ==='bot' && r !== nRows-1) {
        wall = { r: r+1, c, d: 'North' }
      } else if (region === 'left' && c !== 0) {
        wall = { r, c: c-1, d: 'East' }
      } else if (region === 'right' && c !== nCols-1) {
        wall = { r, c, d: 'East' }
      }
      this.$emit('worldClick', { r, c, wall, timestamp: Date.now() })
    },
    agentRotation(d) {
      if (!d) return 0;
      const dir = d.toLowerCase();
      if (dir === 'south') return 0;
      else if (dir === 'west') return 90;
      else if (dir === 'north') return 180;
      else if (dir === 'east') return 270;
      else return 0;
    }
  },
  computed: {
    viewBoxW() { return this.world.nCols * 10 },
    viewBoxH() { return this.world.nRows * 10 },
    eastWalls()  { return this.world.walls.filter(wall => wall.d.toLowerCase() === 'east' )},
    northWalls() { return this.world.walls.filter(wall => wall.d.toLowerCase() === 'north')},
    eastDoors() { return (this.world.doors ?? []).filter(door => door.d.toLowerCase() === 'east' && door.room.row === this.activeRoom.row && door.room.col === this.activeRoom.col)},
    northDoors() { return (this.world.doors ?? []).filter(door => door.d.toLowerCase() === 'north' && door.room.row === this.activeRoom.row && door.room.col === this.activeRoom.col)},
    rotation() {
      const { karelDir } = this.world
      if (!karelDir) return 0
      const dir = karelDir.toLowerCase();
      if (dir === 'south') return 0
      else if (dir === 'west') return 90
      else if (dir === 'north') return 180
      else if (dir === 'east') return 270
      else return 0
    },
    objectiveRotation() {
      const { karelDir } = this.objective
      if (!karelDir) return 0
      const dir = karelDir.toLowerCase();
      if (dir === 'south') return 0
      else if (dir === 'west') return 90
      else if (dir === 'north') return 180
      else if (dir === 'east') return 270
      else return 0
    },
    finalStones() {
      const arr = [];
      const worldStones = this.world.stones.map(stone => ({ ...stone, color: stone.color ? stone.color : 'blue', room: stone.room ? stone.room : {row: 0, col: 0} }));
      const objectiveStones = this.objective.stones.map(stone => ({ ...stone, color: stone.color ? stone.color : 'blue', room: stone.room ? stone.room : {row: 0, col: 0} }));
      worldStones.forEach(stone => {
        if (stone.room.row === this.activeRoom.row && stone.room.col === this.activeRoom.col) {
          arr.push({
            r: stone.r,
            c: stone.c,
            n: stone.n,
            obj: objectiveStones.find(obj => obj.r === stone.r && obj.c === stone.c && obj.color === stone.color && obj.room.row === stone.room.row && obj.room.col === stone.room.col)?.n ?? 0,
            color: stone.color,
            room: stone.room
          });
        }
      });
      objectiveStones.forEach(stone => {
        if (
          !arr.find(obj => obj.r === stone.r && obj.c === stone.c && obj.color === stone.color && obj.room.row === stone.room.row && obj.room.col === stone.room.col) &&
          stone.room.row === this.activeRoom.row && stone.room.col === this.activeRoom.col
        ) {
          arr.push({
            r: stone.r,
            c: stone.c,
            n: 0,
            obj: stone.n,
            color: stone.color,
            room: stone.room
          });
        }
      });
      return arr.map(stone => {
        if (arr.find(obj => obj.r === stone.r && obj.c === stone.c && obj.color !== stone.color && obj.room.row === stone.room.row && obj.room.col === stone.room.col)) {
          return {
            ...stone,
            multi: true
          };
        } else {
          return stone;
        }
      });
    },
    finalAgents() {
      const final = {};
      if (!this.world.agents) {
        this.world.agents = [];
      }
      for (const agentId in this.world.agents) {
        const agent = this.world.agents[agentId];
        if (agent && agent.room.row === this.activeRoom.row && agent.room.col === this.activeRoom.col) {
          final[agentId] = agent
        }
      }
      return final;
    }
  } // end computed
}
</script>

<style scoped>
body
{
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Old versions of Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
}

svg
{
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>