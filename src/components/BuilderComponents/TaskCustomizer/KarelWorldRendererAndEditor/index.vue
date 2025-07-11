<template>
  <div>
  <svg
    :viewBox="`0 0 ${viewBoxW} ${viewBoxH}`"
    style="overflow: hidden;"
    @mouseleave="resetEditModes"
    preserveAspectRatio="xMinYMin meet"
  >

    <!-- Layover for hover over to show controls -->
    <template v-for="n in nRows" :key="`row-${n}`">
      <template v-for="m in nCols" :key="`col-${m}`">
        <rect
          :x="10*(m-1)" :y="10*(n-1)"
          width="10" height="10"
          fill="transparent"
          @mousemove="editRow=n; editCol=m; editWallR=null; editWallC=null; editWallD=null; editDoorR=null; editDoorC=null; editDoorD=null;"
        />
      </template>
    </template>
    
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
    <template v-for="(x,r) in nRows">
      <circle
        v-for="(y,c) in nCols"
        :key="`marker-${r}-${c}`"
        cx="5" cy="5" r="0.3"
        fill="darkgrey"
        :style="`transform: translate(${100*c/nCols}%, ${100*r/nRows}%);`"
      />
    </template>

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

    <!-- CELL DIVIDERS AND GUIDES FOR DRAWING WALLS -->
    <template v-for="(x,r) in nRows" :key="`guide-row-${r}`">
      <template v-for="(y,c) in nCols" :key="`guide-row-${c}`">
        <g :transform="`translate(${c * 10}, ${r * 10})`">
          <!-- Internal Cell Divider Lines (always present) -->
          <line
            v-if="r < nRows - 1"
            x1="0" y1="10" x2="10" y2="10"
            stroke="rgba(0,0,0,0.05)"
            :stroke-width="borderWidth"
          />
          <line
            v-if="c < nCols - 1"
            x1="10" y1="0" x2="10" y2="10"
            stroke="rgba(0,0,0,0.05)"
            :stroke-width="borderWidth"
          />
          <!-- Horizontal Guide Lines on Hover -->
          <g
            v-if="r < nRows - 1"
            @click="toggleWall(r + 1, c, 'North')"
          >
            <path
              d="M 0 10 L 2 8 L 8 8 L 10 10 L 8 12 L 2 12 Z"
              fill="transparent"
              @mousemove="editWallR = r + 1; editWallC = c; editWallD = 'North'; editRow=null; editCol=null; editDoorR=null; editDoorC=null; editDoorD=null;"
              
            />
            <line  x1="0.3" y1="10"   x2="9.7" y2="10"
              pointer-events="none"
              stroke-width="0.2"
              stroke-dasharray="0.5"
              :stroke="editWallR === r+1 && editWallC === c && editWallD ==='North' ? 'coral' : 'transparent'"
            />
          </g>
          <!-- Vertical Guide Lines on Hover -->
          <g
            v-if="c < nCols - 1"
            @click="toggleWall(r , c, 'East')"
          >
            <path
              d="M 10 0 L 8 2 L 8 8 L 10 10 L 12 8 L 12 2 Z"
              fill="transparent"
              @mousemove="editWallR = r ; editWallC = c; editWallD = 'East'; editRow=null; editCol=null; editDoorR=null; editDoorC=null; editDoorD=null;"
              
            />
            <line  x1="10" y1="0.3"   x2="10" y2="9.7"
              pointer-events="none"
              stroke-width="0.2"
              stroke-dasharray="0.5"
              :stroke="editWallR === r && editWallC === c && editWallD ==='East' ? 'coral' : 'transparent'"
            />
          </g>
        </g>
      </template>
    </template>

    <!-- GUIDES FOR DRAWING DOORS -->
    <!-- Horizontal Guide Lines on Hover -->
    <template v-for="(y,c) in nCols" :key="`guide-row-${c}`">
      <g :transform="`translate(${c * 10}, 0)`">
        <g
          @click="toggleDoor(0, c, 'North')"
        >
          <path
            d="M 0 0 L 2 2 L 8 2 L 10 0 L 8 -2 L 2 -2 Z"
            fill="transparent"
            @mousemove="editDoorR = 0; editDoorC = c; editDoorD = 'North'; editRow=null; editCol=null; editWallR=null; editWallC=null; editWallD=null;"
          />
          <line x1="0.3" y1="0"   x2="9.7" y2="0"
            pointer-events="none"
            :stroke-width="borderWidth * 2"
            stroke-dasharray="0.5"
            :stroke="editDoorR === 0 && editDoorC === c && editDoorD ==='North' ? 'darkgrey' : 'transparent'"
          />
        </g>
      </g>
      <g :transform="`translate(${c * 10}, ${nRows * 10})`">
        <g
          @click="toggleDoor(nRows, c, 'North')"
        >
          <path
            d="M 0 0 L 2 2 L 8 2 L 10 0 L 8 -2 L 2 -2 Z"
            fill="transparent"
            @mousemove="editDoorR = nRows; editDoorC = c; editDoorD = 'North'; editRow=null; editCol=null; editWallR=null; editWallC=null; editWallD=null;"
          />
          <line x1="0.3" y1="0"   x2="9.7" y2="0"
            pointer-events="none"
            :stroke-width="borderWidth * 2"
            stroke-dasharray="0.5"
            :stroke="editDoorR === nRows && editDoorC === c && editDoorD ==='North' ? 'darkgrey' : 'transparent'"
          />
        </g>
      </g>
    </template>
    <!-- Vertical Guide Lines on Hover -->
    <template v-for="(x,r) in nRows" :key="`guide-row-${r}`">
      <g :transform="`translate(0, ${r * 10})`">
        <g
          @click="toggleDoor(r, 0, 'East')"
        >
          <path
            d="M 0 0 L -2 2 L -2 8 L 0 10 L 2 8 L 2 2 Z"
            fill="transparent"
            @mousemove="editDoorR = r; editDoorC = 0; editDoorD = 'East'; editRow=null; editCol=null; editWallR=null; editWallC=null; editWallD=null;"
          />
          <line x1="0" y1="0.3"   x2="0" y2="9.7"
            pointer-events="none"
            :stroke-width="borderWidth * 2"
            stroke-dasharray="0.5"
            :stroke="editDoorR === r && editDoorC === 0 && editDoorD ==='East' ? 'darkgrey' : 'transparent'"
          />
        </g>
      </g>
      <g :transform="`translate(${nCols * 10}, ${r * 10})`">
        <g
          @click="toggleDoor(r, nCols, 'East')"
        >
          <path
            d="M 0 0 L -2 2 L -2 8 L 0 10 L 2 8 L 2 2 Z"
            fill="transparent"
            @mousemove="editDoorR = r; editDoorC = nCols; editDoorD = 'East'; editRow=null; editCol=null; editWallR=null; editWallC=null; editWallD=null;"
          />
          <line x1="0" y1="0.3"   x2="0" y2="9.7"
            pointer-events="none"
            :stroke-width="borderWidth * 2"
            stroke-dasharray="0.5"
            :stroke="editDoorR === r && editDoorC === nCols && editDoorD ==='East' ? 'darkgrey' : 'transparent'"
          />
        </g>
      </g>
    </template>

    <!-- STONES -->
    <SvgPositioner v-for="stone in finalStones"
      :key="`stones-${stone.color}-${stone.room.row}-${stone.room.col}-${stone.r}-${stone.c}`"
      anchor="center center"
      :xPos="5 + 10*stone.c + (stone.multi ? (stone.color === 'red' ? 2.5 : -2.5) : 0)"
      :yPos="5 + 10*stone.r - (stone.multi ? 2.5 : 0)"
      :w="stone.multi ? 5 : 7.5"
      @mousemove="editRow=stone.r+1; editCol=stone.c+1; editWallR=null; editWallC=null; editWallD=null; editDoorR=null; editDoorC=null; editDoorD=null;"
    >
      <StoneAndNumber :n="stone.n" :obj="stone.obj" :color="stone.color" :numPosition="stone.multi ? 'middle' : 'top'" />
    </SvgPositioner>

    <!-- AGENTS -->
    <SvgPositioner v-for="agent, id in finalAgents"
      :key="`agent-${id}`"
      anchor="center center"
      :xPos="5 + 10*agent.col"
      :yPos="5 + 10*agent.row"
      :w="7.5"
      :rotation="agentRotation(agent.dir)"
      @mousemove="editRow=agent.row+1; editCol=agent.col+1; editWallR=null; editWallC=null; editWallD=null; editDoorR=null; editDoorC=null; editDoorD=null;"
    >
      <StoneAndNumber :n="-1" :obj="-1" :color="agent.color" :numPosition="'middle'" />
    </SvgPositioner>
      
    <!-- KAREL -->
    <SvgPositioner v-if="karelRoom.row === activeRoom.row && karelRoom.col === activeRoom.col"
      :w="5"
      anchor="center center"
      :xPos="5 + karelCol*10"
      :yPos="5 + karelRow*10"
      :rotation="rotation"
      @click="toggleKarel(karelRow, karelCol)"
    >
      <KarelVueSvg />
    </SvgPositioner>

    <!-- OBJECTIVE KAREL -->
    <SvgPositioner v-if="objKarelRoom.row === this.activeRoom.row && objKarelRoom.col === this.activeRoom.col"
      :w="5"
      anchor="center center"
      :xPos="5 + objKarelCol*10"
      :yPos="5 + objKarelRow*10"
      :rotation="objectiveRotation"
      :opacity="0.5"
      @click="toggleKarel(objKarelRow, objKarelCol)"
    >
      <KarelVueSvg />
    </SvgPositioner>

    <!-- EDIT CONTROLS -->
    <template v-for="(x,r) in nRows">
      <template v-for="(y,c) in nCols">
        <g
          :key="`group-${r}-${c}`"
          v-if="x===editRow && y===editCol"
          :transform="`translate(${c * 10}, ${r * 10})`"
        >
          <!-- Karel Ghost (if karel not in square) -->
          <SvgPositioner
            v-if="editCell === 'KAREL' && !(r === karelRow && c === karelCol && activeRoom.row === karelRoom.row && activeRoom.col === karelRoom.col)"
            :xPos="5" :yPos="5" w="5"
            :rotation="rotation"
            anchor="center center"
            style="opacity: 0.35;"
          >
            <KarelVueSvg />
          </SvgPositioner>

          <!-- Agent Ghost -->
          <SvgPositioner
            v-if="editCell.startsWith('AGENT')"
            :xPos="5" :yPos="5" w="7.5"
            :rotation="activeAgentRotation"
            anchor="center center"
            style="opacity: 0.35;"
          >
            <StoneAndNumber :n="-1" :obj="-1" :color="activeAgentColor" :numPosition="'middle'" />
          </SvgPositioner>

          <!-- Stone Ghost -->
          <SvgPositioner
            v-if="editCell === 'STONE'"
            :xPos="5" :yPos="5" w="7.5"
            anchor="center center"
            style="opacity: 0.35;"
          >
            <StoneAndNumber :n="0" :obj="0" :color="activeColor" />
          </SvgPositioner>

          <!-- Cell edit switch -->
          <SvgPositioner
            v-if="editCell !== 'STONE'"
            :xPos="5-1.6" :yPos="2" h="2"
            anchor="center top"
            @click="toggleCellEdit()"
          >
            <StoneBoxVueSvg :color="activeColor" />
          </SvgPositioner>
          <SvgPositioner
            v-else
            :xPos="5-1.6" :yPos="2" h="2"
            anchor="center top"
            @click="toggleCellEdit()"
          >
            <StoneBoxVueSvg v-if="activeTab > 0" :color="activeAgentColor" />
            <KarelBoxVueSvg v-else />
          </SvgPositioner>

          <!-- Karel Icon -->
          <SvgPositioner
            v-if="editCell === 'KAREL'"
            :xPos="5-1.6" :yPos="8" h="2"
            anchor="center bottom"
            @click="toggleKarel(r, c)"
          >
            <KarelBoxVueSvg />
          </SvgPositioner>

          <!-- Agent Icon -->
          <SvgPositioner
            v-else-if="editCell.startsWith('AGENT')"
            :xPos="5-1.6" :yPos="8" h="2"
            anchor="center bottom"
            @click="toggleAgent(r, c)"
          >
            <StoneBoxVueSvg :color="activeAgentColor" />
          </SvgPositioner>

          <!-- Objective Karel Icon -->
          <SvgPositioner
            v-if="editCell === 'KAREL'"
            :xPos="5+1.6" :yPos="8" h="2"
            anchor="center bottom"
            @click="toggleObjectiveKarel(r, c)"
          >
            <KarelBoxVueSvg :opacity="0.5" />
          </SvgPositioner>

          <!-- Change Color Icon -->
          <SvgPositioner
            v-if="editCell === 'STONE'"
            :xPos="5+1.6" :yPos="2" h="2"
            anchor="center top"
            @click="changeActiveColor()"
          >
            <ColorBoxVueSvg :color="nextColor" />
          </SvgPositioner>
          
          <!-- minus button -->
          <SvgPositioner
            v-if="editCell === 'STONE'"
            :xPos="5-1.6" :yPos="8" h="2"
            anchor="center bottom"
            @click="decrementStones(r, c)"
          >
            <PlusMinusBox symbol="minus" :color="activeColor" />
          </SvgPositioner>
          
          <!-- plus button -->
          <SvgPositioner
            v-if="editCell === 'STONE'"
            :xPos="5+1.6"  :yPos="8" h="2"
            anchor="center bottom"
            @click="incrementStones(r, c)"
          >
            <PlusMinusBox symbol="plus" :color="activeColor" />
          </SvgPositioner>

          <!-- minus objective button -->
          <SvgPositioner
            v-if="editCell === 'STONE'"
            :xPos="5-1.6" :yPos="10" h="2"
            anchor="center bottom"
            @click="decrementObjectiveStones(r, c)"
          >
            <PlusMinusBox symbol="minus" :opacity="0.5" :color="activeColor" />
          </SvgPositioner>

          <!-- plus objective button -->
          <SvgPositioner
            v-if="editCell === 'STONE'"
            :xPos="5+1.6" :yPos="10" h="2"
            anchor="center bottom"
            @click="incrementObjectiveStones(r, c)"
          >
            <PlusMinusBox symbol="plus" :opacity="0.5" :color="activeColor" />
          </SvgPositioner>
        </g>
      </template>
    </template>

  </svg>
  
  <KarelWorldMap
    :rooms="rooms"
    :doors="doors"
    :activeRoom="activeRoom"
    :active="true"
    @room-change="activeRoom = $event"
  />

  </div>
</template>

<script>
import SvgPositioner from '../../../SvgPositioner.vue'
import PlusMinusBox from './PlusMinusBoxVueSvg.vue'
import RotationIconBox from './RotationIconVueSvg.vue'
import StoneAndNumber from './StoneAndNumberVueSvg.vue'
import KarelVueSvg from '../../../../assets/KarelVueSvg.vue'
import KarelBoxVueSvg from './KarelBoxVueSvg.vue'
import StoneBoxVueSvg from './StoneBoxVueSvg.vue'
import ColorBoxVueSvg from './ColorBoxVueSvg.vue'
import KarelWorldMap from '../../../KarelWorldMap.vue'
export default {
  components: {
    SvgPositioner,
    PlusMinusBox,
    RotationIconBox,
    StoneAndNumber,
    KarelVueSvg,
    KarelBoxVueSvg,
    StoneBoxVueSvg,
    ColorBoxVueSvg,
    KarelWorldMap
},
  props: {
    borderWidth: {
      type: Number,
      required: false,
      default: 0.35
    },
    world: {
      type: Object,
      required: true
    },
    objective: {
      type: Object,
      required: true
    },
    activeTab: {
      type: Number,
      required: false,
      default: 0
    }
  },
  data() {
    const { nCols, nRows, karelRow, karelCol, karelDir, walls, stones } = this.world
    for (const wall of walls) {
      if (!wall.room) wall.room = {row: 0, col: 0};
    }
    for (const stone of stones) {
      if (!stone.room) stone.room = {row: 0, col: 0};
    }
    let doors = this.world.doors ?? []
    for (const door of doors) {
      if (!door.room) door.room = {row: 0, col: 0};
    }
    let rooms = this.world.rooms ?? [{row: 0, col: 0}];
    const karelRoom = this.world.karelRoom ?? {row: 0, col: 0}
    const { karelRow: objKarelRow, karelCol: objKarelCol, karelDir: objKarelDir, stones: objStones } = this.objective
    const objKarelRoom = this.objective.objKarelRoom ?? {row: 0, col: 0}
    for (const stone of objStones) {
      if (!stone.color) stone.color = 'blue';
      if (!stone.room) stone.room = {row: 0, col: 0};
    }

    const agents = this.world.agents ?? {};

    return {
      nCols, nRows, karelRow, karelCol, karelDir, karelRoom, walls, doors, rooms, stones,
      objKarelRow, objKarelCol, objKarelDir, objKarelRoom, objStones, agents,
      editRow: null,
      editCol: null,
      editWallR: null,
      editWallC: null,
      editWallD: null,
      editDoorR: null,
      editDoorC: null,
      editDoorD: null,
      editCell: this.activeTab > 0 ? `AGENT${this.activeTab}` : 'KAREL',
      activeColor: 'blue',
      activeRoom: {row: 0, col: 0}
    }
  },
  watch: {
    world: { // when world prop changes, re-align inner states
      deep: true,
      handler(val) {
        const { nCols, nRows, karelRow, karelCol, karelDir, walls, stones } = val
        this.nCols = nCols
        this.nRows = nRows
        this.karelRow = karelRow
        this.karelCol = karelCol
        this.karelDir = karelDir
        this.walls = walls
        for (const wall of this.walls) {
          if (!wall.room) wall.room = {row: 0, col: 0};
        }
        this.doors = val.doors ?? []
        for (const door of this.doors) {
          if (!door.room) door.room = {row: 0, col: 0};
        }
        this.rooms = val.rooms ?? [{row: 0, col: 0}]
        this.karelRoom = val.karelRoom ?? {row: 0, col: 0}
        this.stones = stones.map(stone => ({ ...stone, color: stone.color ? stone.color : "blue" }))
        for (const stone of this.stones) {
          if (!stone.room) stone.room = {row: 0, col: 0};
        }
        this.agents = val.agents ?? {}
      }
    },
    objective: {
      deep: true,
      handler(val) {
        const { karelRow, karelCol, karelDir, karelRoom, stones } = val
        this.objKarelRow = karelRow
        this.objKarelCol = karelCol
        this.objKarelDir = karelDir
        this.objKarelRoom = karelRoom ?? {row: 0, col: 0}
        this.objStones = stones.map(stone => ({ ...stone, color: stone.color ? stone.color : "blue" }))
        for (const stone of this.objStones) {
          if (!stone.room) stone.room = {row: 0, col: 0};
        }
      }
    },
    activeTab: {
      handler(val) {
        if (this.editCell !== 'STONE') {
          this.editCell = val > 0 ? `AGENT${val}` : 'KAREL';
        }
      }
    }
  },
  methods: {
    emitChange() {
      const {
        nCols, nRows, karelRow, karelCol, karelDir, karelRoom, walls, doors, rooms, stones,
        objKarelRow, objKarelCol, objKarelDir, objKarelRoom, objStones, agents
      } = this

      for (const agentId in this.agents) {
        if (!this.agents[agentId]) {
          delete this.agents[agentId];
        }
      }

      this.$emit('change', {
        nCols, nRows, karelRow, karelCol, karelDir, karelRoom, walls, doors, rooms, stones,
        objKarelRow, objKarelCol, objKarelDir, objKarelRoom, objStones, agents
      })
    },
    resetEditModes() {
      this.editRow = null
      this.editCol = null
      this.editWallR = null
      this.editWallC = null
      this.editWallD = null
      this.editDoorR = null
      this.editDoorC = null
      this.editDoorD = null
    },
    numStones(r, c) {
      const index = this.stones.findIndex(stone => stone.r === r && stone.c === c && stone.color === this.activeColor && stone.room.row === this.activeRoom.row && stone.room.col === this.activeRoom.col)
      if (index > -1) return this.stones[index].n
      else return 0
    },
    decrementStones(r, c) {
      const index = this.stones.findIndex(stone => stone.r === r && stone.c === c && stone.color === this.activeColor && stone.room.row === this.activeRoom.row && stone.room.col === this.activeRoom.col)
      if (index > -1) {
        this.stones[index].n -= 1
        if (this.stones[index].n === 0) this.stones.splice(index, 1)
        this.emitChange()
      }
    },
    incrementStones(r, c) {
      const index = this.stones.findIndex(stone => stone.r === r && stone.c === c && stone.color === this.activeColor && stone.room.row === this.activeRoom.row && stone.room.col === this.activeRoom.col)
      if (index > -1) this.stones[index].n += 1
      else this.stones.push({ r, c, n: 1, color: this.activeColor, room: this.activeRoom })
      this.emitChange()
    },
    decrementObjectiveStones(r, c) {
      const index = this.objStones.findIndex(stone => stone.r === r && stone.c === c && stone.color === this.activeColor && stone.room.row === this.activeRoom.row && stone.room.col === this.activeRoom.col)
      if (index > -1) {
        this.objStones[index].n -= 1
        if (this.objStones[index].n === 0) this.objStones.splice(index, 1)
        this.emitChange()
      }
    },
    incrementObjectiveStones(r, c) {
      const index = this.objStones.findIndex(stone => stone.r === r && stone.c === c && stone.color === this.activeColor && stone.room.row === this.activeRoom.row && stone.room.col === this.activeRoom.col)
      if (index > -1) this.objStones[index].n += 1
      else this.objStones.push({ r, c, n: 1, color: this.activeColor, room: this.activeRoom })
      this.emitChange()
    },
    toggleKarel(r, c) {
      const nextDirectionMap = { North: 'East', East: 'South', South: 'West', West: 'North' }
      if (this.karelRow === r && this.karelCol === c && this.karelRoom.row === this.activeRoom.row && this.karelRoom.col === this.activeRoom.col) {
        this.karelDir = nextDirectionMap[this.karelDir]
      } else {
        this.karelRow = r
        this.karelCol = c
        this.karelRoom.row = this.activeRoom.row
        this.karelRoom.col = this.activeRoom.col
      }
      this.emitChange()
    },
    toggleObjectiveKarel(r, c) {
      const nextDirectionMap = { North: 'East', East: 'South', South: 'West', West: 'North' }
      if (this.objKarelRow === r && this.objKarelCol === c && this.objKarelRoom.row === this.activeRoom.row && this.objKarelRoom.col === this.activeRoom.col) {
        this.objKarelDir = nextDirectionMap[this.objKarelDir]
      } else {
        this.objKarelRow = r
        this.objKarelCol = c
        this.objKarelRoom.row = this.activeRoom.row
        this.objKarelRoom.col = this.activeRoom.col
      }
      this.emitChange()
    },
    toggleAgent(r, c) {
      const nextDirectionMap = { North: 'East', East: 'South', South: 'West', West: 'North' };

      if (this.agents[this.activeTab].row === r && this.agents[this.activeTab].col === c && this.agents[this.activeTab].room.row === this.activeRoom.row && this.agents[this.activeTab].room.col === this.activeRoom.col) {
        this.agents[this.activeTab].dir = nextDirectionMap[this.agents[this.activeTab].dir];
      } else {
        this.agents[this.activeTab].row = r;
        this.agents[this.activeTab].col = c;
        this.agents[this.activeTab].room.row = this.activeRoom.row;
        this.agents[this.activeTab].room.col = this.activeRoom.col;
      }

      this.emitChange();
    },
    toggleWall(r, c, d) {
      const index = this.walls.findIndex(wall => wall.r === r && wall.c === c && wall.d === d)
      if (index > -1) {
        this.walls.splice(index, 1)
        this.walls = [ ...this.walls ]
      } else {
        this.walls.push({ r, c, d })
      }
      this.emitChange()
    },
    toggleDoor(r, c, d) {
      let rOff = 0
      let cOff = 0
      let rAbs = r
      let cAbs = c
      if (d === 'North' && r === 0) {
        rOff = -1
        rAbs = this.nRows
      } else if(d === 'North' && r === this.nRows) {
        rOff = 1
        rAbs = 0
      } else if (d === 'East' && c === 0) {
        cOff = -1
        cAbs = this.nCols
      } else if(d === 'East' && c === this.nCols) {
        cOff = 1
        cAbs = 0
      }

      const index = this.doors.findIndex(door => door.r === r && door.c === c && door.d === d && door.room.row === this.activeRoom.row && door.room.col === this.activeRoom.col)
      if (index > -1) {
        this.doors.splice(index, 1)

        if (rOff != 0 || cOff != 0) {
          const otherIndex = this.doors.findIndex(door => door.r === rAbs && door.c === cAbs && door.d === d && door.room.row === this.activeRoom.row + rOff && door.room.col === this.activeRoom.col + cOff)
          if (otherIndex > -1) {
            this.doors.splice(otherIndex, 1)
          } else {
            console.error("Corresponding door not found")
          }

          if (
            (this.activeRoom.row + rOff !== 0 || this.activeRoom.col + cOff !== 0) &&
            this.doors.every(door => !(door.room.row === this.activeRoom.row + rOff && door.room.col === this.activeRoom.col + cOff))
          ) {
            const roomIndex = this.rooms.findIndex(room => room.row === this.activeRoom.row + rOff && room.col === this.activeRoom.col + cOff)
            if (roomIndex > -1) {
              // Remove stones
              for (let i = this.stones.length - 1; i >= 0; i--) {
                if (this.stones[i].room.row === this.activeRoom.row + rOff && this.stones[i].room.col === this.activeRoom.col + cOff) {
                  this.stones.splice(i, 1)
                }
              }
              this.stones = [ ...this.stones ]

              // Remove objective stones
              for (let i = this.objStones.length - 1; i >= 0; i--) {
                if (this.objStones[i].room.row === this.activeRoom.row + rOff && this.objStones[i].room.col === this.activeRoom.col + cOff) {
                  this.objStones.splice(i, 1)
                }
              }
              this.objStones = [ ...this.objStones ]

              // Remove Karel
              if (this.karelRoom.row === this.activeRoom.row + rOff && this.karelRoom.col === this.activeRoom.col + cOff) {
                this.karelRoom = {row: 0, col: 0}
                this.karelRow = 0
                this.karelCol = 0
              }

              // Remove objective Karel
              if (this.objKarelRoom.row === this.activeRoom.row + rOff && this.objKarelRoom.col === this.activeRoom.col + cOff) {
                this.objKarelRoom = {row: 0, col: 0}
                this.objKarelRow = 0
                this.objKarelCol = 0
              }

              this.rooms.splice(roomIndex, 1)
            } else {
              console.error("Corresponding room not found")
            }
          }

          if (
            (this.activeRoom.row !== 0 || this.activeRoom.col !== 0) &&
            this.doors.every(door => !(door.room.row === this.activeRoom.row && door.room.col === this.activeRoom.col))
          ) {
            const roomIndex = this.rooms.findIndex(room => room.row === this.activeRoom.row && room.col === this.activeRoom.col)
            if (roomIndex > -1) {
              // Remove stones
              for (let i = this.stones.length - 1; i >= 0; i--) {
                if (this.stones[i].room.row === this.activeRoom.row && this.stones[i].room.col === this.activeRoom.col) {
                  this.stones.splice(i, 1)
                }
              }
              this.stones = [ ...this.stones ]

              // Remove objective stones
              for (let i = this.objStones.length - 1; i >= 0; i--) {
                if (this.objStones[i].room.row === this.activeRoom.row && this.objStones[i].room.col === this.activeRoom.col) {
                  this.objStones.splice(i, 1)
                }
              }
              this.objStones = [ ...this.objStones ]

              // Remove Karel
              if (this.karelRoom.row === this.activeRoom.row && this.karelRoom.col === this.activeRoom.col) {
                this.karelRoom = {row: 0, col: 0}
                this.karelRow = 0
                this.karelCol = 0
              }

              // Remove objective Karel
              if (this.objKarelRoom.row === this.activeRoom.row && this.objKarelRoom.col === this.activeRoom.col) {
                this.objKarelRoom = {row: 0, col: 0}
                this.objKarelRow = 0
                this.objKarelCol = 0
              }

              this.rooms.splice(roomIndex, 1)

              this.activeRoom.row = 0
              this.activeRoom.col = 0
            } else {
              console.error("Current room not found")
            }
          }

          this.rooms = [ ...this.rooms ]
        }

        this.doors = [ ...this.doors ]
      } else {
        this.doors.push({ r, c, d, room: {row: this.activeRoom.row, col: this.activeRoom.col} })

        if (rOff != 0 || cOff != 0) {
          if (this.rooms.every(room => !(room.row === this.activeRoom.row + rOff && room.col === this.activeRoom.col + cOff))) {
            this.rooms.push({row: this.activeRoom.row + rOff, col: this.activeRoom.col + cOff});
          }

          this.doors.push({ r: rAbs, c: cAbs, d, room: {row: this.activeRoom.row + rOff, col: this.activeRoom.col + cOff} });
        }
      }
      this.emitChange()
    },
    toggleCellEdit() {
      if (this.editCell !== 'STONE') {
        this.editCell = 'STONE';
      } else {
        this.editCell = this.activeTab > 0 ? `AGENT${this.activeTab}` : 'KAREL';
      }
    },
    changeActiveColor() {
      if (this.activeColor === 'blue') {
        this.activeColor = 'red';
      } else {
        this.activeColor = 'blue';
      }
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
      viewBoxW() { return this.nCols * 10 },
      viewBoxH() { return this.nRows * 10 },
      eastWalls()  { return this.walls.filter(wall => wall.d.toLowerCase() === 'east' && wall.room.row === this.activeRoom.row && wall.room.col === this.activeRoom.col) },
      northWalls() { return this.walls.filter(wall => wall.d.toLowerCase() === 'north' && wall.room.row === this.activeRoom.row && wall.room.col === this.activeRoom.col)},
      eastDoors() { return this.doors.filter(door => door.d.toLowerCase() === 'east' && door.room.row === this.activeRoom.row && door.room.col === this.activeRoom.col)},
      northDoors() { return this.doors.filter(door => door.d.toLowerCase() === 'north' && door.room.row === this.activeRoom.row && door.room.col === this.activeRoom.col)},
      rotation() {
          if (!this.karelDir) return 0
          const dir = this.karelDir.toLowerCase();
          if (dir === 'south') return 0
          else if (dir === 'west') return 90
          else if (dir === 'north') return 180
          else if (dir === 'east') return 270
          else return 0
      },
      objectiveRotation() {
        if (!this.objKarelDir) return 0
        const dir = this.objKarelDir.toLowerCase();
        if (dir === 'south') return 0
        else if (dir === 'west') return 90
        else if (dir === 'north') return 180
        else if (dir === 'east') return 270
        else return 0
      },
      finalStones() {
        const arr = [];
        this.stones.forEach(stone => {
          if (stone.room.row === this.activeRoom.row && stone.room.col === this.activeRoom.col) {
            arr.push({
              r: stone.r,
              c: stone.c,
              n: stone.n,
              obj: this.objStones.find(obj => obj.r === stone.r && obj.c === stone.c && obj.room.row === stone.room.row && obj.room.col === stone.room.col && obj.color === stone.color)?.n ?? 0,
              color: stone.color,
              room: stone.room
            })
          }
        });
        this.objStones.forEach(stone => {
          if (
            !arr.find(obj => obj.r === stone.r && obj.c === stone.c && obj.room.row === stone.room.row && obj.room.col === stone.room.col && obj.color === stone.color) &&
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
          if (arr.find(obj => obj.r === stone.r && obj.c === stone.c && obj.room.row === stone.room.row && obj.room.col === stone.room.col && obj.color !== stone.color)) {
            return {
              ...stone,
              multi: true
            }
          } else {
            return stone
          }
        });
      },
      finalAgents() {
        const final = {};
        for (const agentId in this.agents) {
          const agent = this.agents[agentId];
          if (agent && agent.room.row === this.activeRoom.row && agent.room.col === this.activeRoom.col) {
            final[agentId] = agent
          }
        }
        return final;
      },
      activeAgentColor() {
        if (this.activeTab <= 0) {
          return;
        }

        for (const agentId in this.agents) {
          if (parseInt(agentId) === this.activeTab) {
            return this.agents[agentId].color;
          }
        }
      },
      activeAgentRotation() {
        if (this.activeTab <= 0) {
          return;
        }

        for (const agentId in this.agents) {
          if (parseInt(agentId) === this.activeTab) {
            return this.agentRotation(this.agents[agentId].dir);
          }
        }
      },
      nextColor() {
        if (this.activeColor === "blue") {
          return "red"
        } else {
          return "blue"
        }
      }
  }, // end computed
};
</script>