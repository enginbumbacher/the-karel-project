<template>
  <div class="container no-select">
    <div id="worlds-and-workspace">
      
      <div class="start-world-area">
        <KarelWorldRendererAndEditor
          class="edit-start-world"
          :world="activeWorld.preWorld"
          :objective="activeWorld.postWorld"
          :activeTab="activeEditorTab"
          @change="updateWorld($event)"
        />
      </div>
      
      <div class="karel-blockly-wrapper">
        <KarelBlockly
            v-if="!isPython"
            v-model:toolbox="karelBlockly.toolbox"
            v-model:workspace="karelBlockly.workspace"
            v-model:worldWorkspace="karelBlockly.worldWorkspace"
            v-model:settings="karelBlockly.settings"
            v-model:highlight="karelBlockly.highlight"
            v-model:agents="agents"
            v-model:activeEditorTab="activeEditorTab"
        />
        <KarelPython
            v-else
            v-model:code="pythonCode"
            v-model:world="worldPython"
            :hasWorld="karelBlockly.settings.blocks.karel_events.active"
            v-model:agents="agents"
            v-model:activeTab="activeEditorTab"
            :console-text="''"
            :highlight="{ line: 0 }"
            :error="{ line: 0, message: '' }"
        />
      </div>
    </div>
    <div id="tabs">
      <div id="tab-bar"
      >
        <span v-for="tabName in [ 'Basic', 'Toolbox', 'Multi-World', 'Tags', 'Agents' ]"
          :key="`tab-${tabName}`"
          @click="activeTab = tabName"
          :class="{ active: activeTab === tabName, tab: true }"
        >
          {{ tabName }}
        </span>
        <span class="spaceholder"></span>
      </div>
      <div id="tab-body">
        <div id="tab-body-scroller">
          <div v-show="activeTab === 'Toolbox'">
            <KarelBlocklySettingsEditor
              :settings="karelBlockly.settings"
              @toggleBlock="toggleBlock"
              @setBlockLimit="({ name, amount }) => setBlockLimit(name, amount)"
              @updateSetting="({ name, value }) => updateBlocklySetting(name, value)"
              :maxBlocks="maxBlocks"
              @updateMaxBlocks="maxBlocks = $event"
            />
          </div>
          
          <div id='basic-settings' v-show="activeTab === 'Basic'">
            
            <div id="basic-settings-left-side">
              <div class="task-name-wrapper">
                <span>Task Name: </span>
                <input
                  id="task-name"
                  placeholder="Task Name goes here..."
                  v-model="name"
                />
              </div>
              <div class="instructions-wrapper">
                <div>Instructions:</div>
                <textarea
                  id="task-instructions"
                  placeholder="Instructions go here..."
                  v-model="instructions"
                />
              </div>
            </div>

            <div id="basic-settings-right-side">
              <div>
                Rows:
                <button @click="handleRowOrColChange('nRows', -1)">-</button>
                <button @click="handleRowOrColChange('nRows', 1)">+</button>
                Cols:
                <button @click="handleRowOrColChange('nCols', -1)">-</button>
                <button @click="handleRowOrColChange('nCols', 1)">+</button>
              </div>

              <div>
                Use Python:
                <input id="use-python" type="checkbox" :checked="isPython" @click="isPython = !isPython" />
              </div>

              <div class="hint-wrapper">
                <div>Hint: (optional) </div>
                <textarea
                  id="task-hint"
                  placeholder="Hint goes here..."
                  v-model="hint"
                />
              </div>
              
            </div>
          </div>
          <!-- END OF BASIC SETTINGS TAB -->
          
          <div v-show="activeTab === 'Tags'">
            <KarelTagSelector :tags="tags" @change="tags = $event" />
          </div>

          <div id="multi-world" v-show="activeTab === 'Multi-World'">
            <h4>Active World: {{ activeWorldIndex + 1 }}</h4>
            <button
              v-for="(w,i) in worlds"
              :key="`select-world-button-${i}`"
              @click="activeWorldIndex = i"
              :disabled="activeWorldIndex === i"
            >
              Select World {{ i + 1 }}
            </button>
            <br>
            <button
              @click="addWorld"
              :disabled="worlds.length >= 4"
            >Add World</button>
            <br>
            <button
              v-for="(w,i) in worlds"
              :key="`remove-world-button-${i}`"
              @click="removeWorld(i)"
              :disabled="worlds.length === 1"
            >
              Remove World {{ i + 1 }}
            </button>
            <br>
            <div>
              Blue starting count: {{ activeWorld.preWorld.pickedStones?.blue ?? 0 }}
              <button @click="changeStartingCount('blue', -1)">-</button>
              <button @click="changeStartingCount('blue', 1)">+</button>
            </div>
            <br>
            <div>
              Red starting count: {{ activeWorld.preWorld.pickedStones?.red ?? 0 }}
              <button @click="changeStartingCount('red', -1)">-</button>
              <button @click="changeStartingCount('red', 1)">+</button>
            </div>
          </div>

          <div v-if="activeTab === 'Agents'">
            <h4>Agents</h4>
            <div v-for="agent in agents" :key="agent.id">
              <input :id="`agent${agent.id}-name`" type="text" placeholder="Agent name" v-model="agent.name" />
              <input :id="`agent${agent.id}-color`" type="text" placeholder="Agent color" v-model="agent.color" @input="(e) => {
                for (world of worlds) {
                  world.preWorld.agents[agent.id].color = e.target.value;
                }
              }" />
              <input type="checkbox" :id="`agent${agent.id}-show`" v-model="agent.showTab" />
              <label :for="`agent${agent.id}-show`">Show tab</label>
              <input type="checkbox" :id="`agent${agent.id}-edit`" v-model="agent.allowEdit" />
              <label :for="`agent${agent.id}-edit`">Allow edit</label>
              <button @click="removeAgent(agent.id)">Remove</button>
              <br>
            </div>
            <button @click="addAgent()">Add agent</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import _ from 'lodash'
import KarelWorldRendererAndEditor from './KarelWorldRendererAndEditor/index.vue'
import KarelBlockly from '../../KarelBlockly/index.vue'
import KarelPython from '../../KarelPython/index.vue'
import KarelTagSelector from './KarelTagSelector.vue'
import KarelBlocklySettingsEditor from './KarelBlocklySettingsEditor.vue' 
import defaultNewTaskState from '../../../store/defaultNewTaskState.js'
import { invalidResizeWallsSwal, invalidResizeKarelSwal, invalidResizeStonesSwal } from '../../../helpers/projectSwallows.js'


const copy = (val)  => JSON.parse(JSON.stringify(val))

export default {
  name: 'task-customizer',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  components: {
    KarelWorldRendererAndEditor,
    KarelBlockly,
    KarelPython,
    KarelTagSelector,
    KarelBlocklySettingsEditor
  },
  data() {
    const taskAtId = this.$store.getters.content(this.id)
    const taskToStartCustomizingFrom = taskAtId ? copy(taskAtId) : copy(defaultNewTaskState)
    const {
      name,
      instructions,
      maxBlocks,
      hint,
      worlds,
      isPython,
      pythonCode,
      worldPython,
      karelBlockly,
      tags
    } = taskToStartCustomizingFrom
    if (!karelBlockly.worldWorkspace) karelBlockly.worldWorkspace = '<xml xmlns="https://developers.google.com/blockly/xml"><block type="karel_world_main" id="world_main" deletable="false" x="44" y="0"></block><block type="karel_world_end_conditions" id="world_end_conditions" deletable="false" x="44" y="100"></block></xml>';

    // customizerMode toggles if user can lock/unlock fn blocks
    karelBlockly.settings.customizerMode = true

    const agents = taskToStartCustomizingFrom.agents ?? []

    return {
      activeTab: 'Basic',
      activeWorldIndex: 0,
      name,
      instructions,
      maxBlocks,
      hint,
      worlds,
      isPython,
      pythonCode,
      worldPython,
      karelBlockly,
      tags,
      agents,
      agentId: agents.length === 0 ? 1 : (Math.max(...agents.map(agent => agent.id)) + 1),
      activeEditorTab: 0
    }
  },
  computed: {
    activeWorld() { return this.worlds[this.activeWorldIndex] }
  },
  watch: {
    '$data': {
      deep: true,
      handler() { this.update() },
      immediate: true
    },
    'activeWorld.preWorld.walls': {
      handler( curr ) {
        if (!_.isEqual(this.activeWorld.postWorld.walls, curr)) {
          this.activeWorld.postWorld.walls = copy(curr)
        }
      },
      deep: true,
    },
    'activeWorld.postWorld.walls': {
      handler( curr ) {
        if (!_.isEqual(this.activeWorld.preWorld.walls, curr)) {
          this.activeWorld.preWorld.walls = copy(curr)
        }
      },
      deep: true,
    },
    'karelBlockly.settings': {
      handler(settings) {
        this.tags.systemTags = this.getSystemTags(settings)
      },
      immediate: true,
      deep: true,
    },
    maxBlocks() {
      this.tags.systemTags = this.getSystemTags(this.karelBlockly.settings)
    },
    'worlds.length'() {
      this.tags.systemTags = this.getSystemTags(this.karelBlockly.settings)
    }
  },
  methods: {
    addWorld() {
      const copyLastWorld = copy(this.worlds[this.worlds.length - 1])
      this.worlds.push(copyLastWorld)
      this.activeWorldIndex = this.worlds.length - 1
    },
    removeWorld(i) {
      this.activeWorldIndex = 0
      this.worlds.splice(i,1)
    },
    changeStartingCount(color, delta) {
      if (!this.activeWorld.preWorld.pickedStones) this.activeWorld.preWorld.pickedStones = { blue: 0, red: 0 }
      this.activeWorld.preWorld.pickedStones[color] += delta
      if (this.activeWorld.preWorld.pickedStones[color] < 0) this.activeWorld.preWorld.pickedStones[color] = 0
    },
    updateWorld(world) {
      const {
        nCols, nRows, karelRow, karelCol, karelDir, karelRoom, walls, doors, rooms, stones,
        objKarelRow, objKarelCol, objKarelDir, objKarelRoom, objStones, agents
      } = world;
      const pickedStones = this.activeWorld.preWorld.pickedStones;
      this.activeWorld.preWorld = {
        nCols, nRows, karelRow, karelCol, karelDir, karelRoom, walls, doors, rooms, stones, agents, pickedStones
      };
      this.activeWorld.postWorld = {
        nCols, nRows, karelRow: objKarelRow, karelCol: objKarelCol, karelDir: objKarelDir, karelRoom: objKarelRoom, walls, doors, rooms, stones: objStones
      };
    },
    update() {
      const { name, instructions, maxBlocks, hint, worlds, isPython, pythonCode, worldPython, tags, agents } = this
      // karelBlockly pulled separately, customizerMode false for save
      const karelBlockly = copy(this.karelBlockly)
      karelBlockly.settings.customizerMode = false
      const customizerStateData = copy({ name, instructions, maxBlocks, hint, worlds, isPython, pythonCode, worldPython, karelBlockly, tags, agents })
      this.$store.dispatch('updateCustomizerState', customizerStateData )
    },
    getSystemTags(settings) {
      if (!settings) return []
      let systemTags = []
      // destrusture all blocks from settings.blocks
      const { karel_move, karel_turn, karel_place, karel_pickup, karel_repeat, karel_ifelse, karel_variable, karel_while, karel_define, karel_events, karel_agents } = settings.blocks
      if (karel_repeat?.active) systemTags.push("Has 'Repeat'")
      if (karel_ifelse.active) systemTags.push("Has 'If'")
      if (karel_while?.active) systemTags.push("Has 'While'")
      if (karel_variable?.active) systemTags.push("Has Variable")
      if (karel_define?.active) systemTags.push("Has Function")
      if (karel_events?.active) systemTags.push("Has Events")
      if ( karel_move?.active && karel_turn?.active && karel_place?.active  && karel_pickup?.active &&
        !karel_repeat?.active && !karel_ifelse?.active && !karel_while?.active && !karel_define?.active ) {
        systemTags.push("Basic Toolbox")
      }
      if (karel_agents?.active) systemTags.push("Has Agents")
      const someBlockLimited = Object.values(settings.blocks).some(block => block.active && block.limit !== -1)

      const totalBlocksLimited = this.maxBlocks
      if (this.worlds.length > 1) systemTags.push("Multi-World")

      if (someBlockLimited || totalBlocksLimited) {
        systemTags.push("Limit Blocks")
      }
      if (Object.values(settings.blocks).every(block => block.active)) {
        systemTags.push("Full Toolbox")
      }
      if (!settings.showToolbox) systemTags.push("Parson's Problem")
      
      return systemTags
    },
    handleRowOrColChange (param, delta) {
      const newN = this.activeWorld.preWorld[param] + delta

      const allWalls =  [ ...this.activeWorld.preWorld.walls, ...this.activeWorld.postWorld.walls ]
      const allStones = [ ...this.activeWorld.preWorld.stones, ...this.activeWorld.postWorld.stones ]
      
      // determine if karel is within new bounds
      const karelParam = (param === 'nCols') ? 'karelCol' : 'karelRow'
      const karelN = Math.max(this.activeWorld.preWorld[karelParam], this.activeWorld.postWorld[karelParam])
      const isKarelInBounds = (karelN < newN)
      
      // determine if any stones out of bounds
      const stoneParam = (param === 'nCols') ? 'c' : 'r'
      const isAnyStoneOutOfBounds = allStones.some( s => s[stoneParam] >= newN && s.n )
      const areAllStonesInBounds = !isAnyStoneOutOfBounds
      
      // determing if any walls are out of bounds or on border
      const wallParam = (param === 'nCols') ? 'c' : 'r'
      const isAnyWallOutOfBounds = allWalls.some(w => w[wallParam] >= newN)
      // We don't need to check north world edge, as impossible to create.  Only test east edge.
      let isAnyWallOnWorldEastEdge
      if (param === 'nCols') { // so only test if nCols === param, and newN is the new num of columns
        isAnyWallOnWorldEastEdge = allWalls.some(w => (w.c === newN - 1 && w.d ==='East'))
      }
      const wallsValid = !isAnyWallOutOfBounds && !isAnyWallOnWorldEastEdge
      
      if (!areAllStonesInBounds) invalidResizeStonesSwal()
      else if (!isKarelInBounds) invalidResizeKarelSwal()
      else if (!wallsValid) invalidResizeWallsSwal()
      else {
        this.activeWorld.preWorld[param] = newN
        this.activeWorld.postWorld[param] = newN
      }
    },
    toggleBlock(blockName) {
      const block = this.karelBlockly.settings.blocks[blockName]
      block.active = !block.active
    },
    setBlockLimit(blockName, limit) {
      this.karelBlockly.settings.blocks[blockName].limit = limit
    },
    updateBlocklySetting(param, val) {
      this.karelBlockly.settings[param] = val
    },
    addAgent() {
      this.agents.push({
        id: this.agentId,
        name: `Agent ${this.agentId}`,
        color: '',
        workspace: this.karelBlockly.workspace,
        showTab: true
      });

      for (const world of this.worlds) {
        if (!world.preWorld.agents) {
          world.preWorld.agents = {};
        }

        world.preWorld.agents[this.agentId] = {
            row: 0,
            col: 0,
            dir: 'East',
            room: {row: 0, col: 0},
            color: ''
        };
      }

      this.agentId++;
    },
    removeAgent(id) {
      this.agents = this.agents.filter(agent => agent.id !== id)

      for (const world of this.worlds) {
        if (world.preWorld.agents) {
          delete world.preWorld.agents[id]
        }
      }
    }
  }
}
</script>

<style scoped>
  .no-select {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
  }    
  .container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  textarea, input {
    font-family: inherit;
    color: inherit;
    font-size: 0.95rem;
  }
  .start-world-area,
  .end-world-area {
    width: 30%;
    height: 100%;
    margin: 10px;
    display: flex;
    flex-direction: column;
  }
  .edit-start-world,
  .edit-post-world {
    max-height: 500px;
  }
  h4 { margin: 0; padding: 0;}
  .karel-renderer-wrapper {
    flex: 1 0 0;
  }
  .karel-blockly-wrapper {
    width: 40%;
    height: 100%;
  }
  #tabs
  {
    flex-shrink: 0;
    padding: 10px;
    height: 32%;
    min-height: 240px;
    display: flex;
    flex-direction: column;
  }
  #tab-body
  {
    position: relative;
    padding: 4px;
    border: 2px solid grey;
    border-top: none;
    border-radius: 0 0 4px 4px;
    flex-basis: 0;
    flex-grow: 1;
    overflow: scroll;
  }
  #tab-body-scroller
  {
    width: 100%;
    height: 100%;
    position: absolute;
    overflow: scroll;
  }
  #tab-body-scroller > div
  {
    height: 100%;
  }
  #worlds-and-workspace
  {
    flex-grow: 1;
    flex-basis: 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
  #tab-bar { display: flex; }
  .tab
  {
    border-radius: 6px 6px 0 0;
    border: 2px solid grey;
    padding: 6px;
    cursor: pointer;
    display: inline-block;
    background: lightgray;
  }
  .tab.active
  {
    background: white;
    border-bottom: none;
  }
  .spaceholder {
    border: none;
    border-bottom: 2px solid grey;
    flex-grow: 1;
  }
  #basic-settings {
    display: flex;
  }
  #basic-settings-left-side,
  #basic-settings-right-side {
    display: flex;
    flex-direction: column;
    width: 350px;
    margin: 6px 20px 20px 20px;
    flex: 1 0 0;

  }
  #multi-world button {
    margin: 4px;
  }
  .instructions-wrapper,
  .hint-wrapper {
    flex: 1 0 0;
    display: flex;
    flex-direction: column;
  }
  textarea#task-instructions,
  textarea#task-hint {
    width: 280px;
    flex: 1 0 0;
    margin-top: 4px;
    outline: none;
    resize: none;
    border: none;
    border-radius: 6px;
    background: lightblue;
  }
  
  /* hide scrollbar */
  *
  {
      -ms-overflow-style: none; /* for Internet Explorer, Edge */
      scrollbar-width: none; /* for Firefox */
  }
  
  *::-webkit-scrollbar {
      display: none; /* for Chrome, Safari, and Opera */
  }
</style>