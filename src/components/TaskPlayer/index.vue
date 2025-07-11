<template>
  <div class="container">
    <div class="left-col">
      <div class="instructions-and-reset-wrapper">
        <div class="instructions-box">
          <b>Challenge:</b> {{ task.instructions }}
          <p v-if="task.maxBlocks" class="max-blocks-p">
            Solve the challenge using <b>{{task.maxBlocks}}</b> or fewer blocks. The current code uses <b :style="`color: ${blocksUsed > task.maxBlocks ? 'red' : 'green'};`">{{ blocksUsed }}</b> blocks.
          </p>
        </div>
        <button v-if="!karelBlockly.settings.disabled" class="karel-button reset" @click="resetTask">Reset Code</button>
      </div>

      <div class="world-wrapper">
        <KarelWorldRenderer :world="world" :objective="activePostWorld" :activeRoom="playing ? world.karelRoom : activeRoom" />
      </div>

      <div style="display: flex; gap: 32px;">
        <!-- Backpack -->
        <div style="display: flex;">
          <img src="../../assets/karelBackpack.png" alt="Karel with a backpack" height="64px" />
          <div style="width: 64px" >
            <StoneAndNumber :n="world.pickedStones?.blue ?? 0" obj="-1" numPosition="middle" color="blue" />
          </div>
          <div style="width: 64px" >
            <StoneAndNumber :n="world.pickedStones?.red ?? 0" obj="-1" numPosition="middle" color="red" />
          </div>
        </div>

        <!-- World map (multiple rooms) -->
        <KarelWorldMap
          :rooms="activePreWorld.rooms"
          :doors="activePreWorld.doors"
          :activeRoom="playing ? world.karelRoom : activeRoom"
          :active="!playing"
          @room-change="activeRoom = $event"
        />

        <!-- Arrows (input for tablet) -->
        <KarelArrows
          v-if="karelBlockly.settings.blocks.karel_events.active"
          v-model="directions"
        />
      </div>


      <!-- Scenario Selector, if More Than One -->
      <div v-if="task.worlds.length > 1" class="scenario-selector">
        <div
          v-for="(n,i) in task.worlds"
          :key='`radio-template-${i}`'
          :class="{
            scenario: true,
            active: activeScenarioIndex === i,
            unattempted: correctScenarios[i] === null,
            correct: correctScenarios[i] === true,
            incorrect: correctScenarios[i] === false
          }"
        >
          <input
            type="radio"
            :key="`world-${i}`"
            :id="`world-${i}`"
            :value="i"
            v-model="activeScenarioIndex"
          />
          <label :for="`world-${i}`">{{ getScenarioLabel(i) }}</label>
        </div>
      </div>

      <div class="controls-wrapper">
        <KarelBlocklyPlayerAndControls
          v-if="karelBlockly"
          :toolbox="karelBlockly.toolbox"
          :workspace="karelBlockly.workspace"
          :world-workspace="karelBlockly.settings.blocks.karel_events?.active ? karelBlockly.worldWorkspace : undefined"
          :stepSpeed="stepSpeed"
          :preWorld="activePreWorld"
          :playing="playing"
          :isPython="isPython"
          :pythonCode="pythonCode"
          :worldPython="worldPython"
          :errorCallback="errorCallback"
          :highlight="highlight"
          :settings="karelBlockly.settings"
          :agentWorkspaces="agentWorkspaces"
          :agentPythonCodes="agentPythonCodes"
          :directions="directions"
          @play="playing = true"
          @pause="playing = false"
          @step="currentStepData = $event; if (currentStepData) { activeRoom = currentStepData.world.karelRoom } else { pythonHighlights = {} }"
          @setStepSpeed="stepSpeed = $event"
        />
      </div>
      <div>
        <button class="karel-button hint" v-if="task.hint" @click="showHint">hint</button>
      </div>
    </div>

    <div class="right-col">
      <KarelBlockly
        v-if="!isPython"
        v-model:toolbox="karelBlockly.toolbox"
        v-model:workspace="karelBlockly.workspace"
        v-model:worldWorkspace="karelBlockly.worldWorkspace"
        v-model:settings="karelBlockly.settings"
        v-model:highlight="karelBlockly.highlight"
        v-model:activeEditorTab="activeEditorTab"
        v-model:agents="agentTabs"
        :runningTab="currentStepData?.currentId"
      />
      <div v-else style="display: flex; flex-direction: column; width: 100%; height: 100%">
        <div style="background-color: lightgrey; padding: 2px">
          Limits:
          <button @click="showLimits = !showLimits" style="border: none; background-color: transparent; float: right; cursor: pointer">
            {{ showLimits ? '◀' : '▼' }}
          </button>
          <ul :style="{ display: showLimits ? 'block' : 'none', padding: '0 20px', margin: 0 }">
            <li v-for="limit in finalSettings">
              {{ limit.name }}: {{ limit.limit }}
            </li>
          </ul>
        </div>
        <KarelPython
          v-model:code="pythonCode"
          :console-text="currentStepData?.pythonText ?? ''"
          :highlights="pythonHighlights"
          :error="pythonError"
          :world="worldPython"
          :hasWorld="karelBlockly.settings.blocks.karel_events.active"
          v-model:agents="agentTabs"
          :activeTab="0"
          :readonly="true"
          :runningTab="currentStepData?.currentId"
          :showConsole="true"
        />
      </div>
    </div>
  </div>
</template>

<script>
import KarelBlocklyPlayerAndControls from './KarelBlocklyPlayerAndControls/index.vue'
import KarelWorldRenderer from '../KarelWorldRenderer.vue'
import KarelBlockly from '../KarelBlockly/index.vue'
import KarelPython from '../KarelPython/index.vue'
import worldsMatch from './karelWorldsMatch.js'
import {
  taskSuccessSwal,
  taskPartialSuccessSwal,
  taskIncorrectSwal,
  taskTooManyBlocksSwal,
  taskHintSwal
} from '../../helpers/projectSwallows.js'
import StoneAndNumber from '../BuilderComponents/TaskCustomizer/KarelWorldRendererAndEditor/StoneAndNumberVueSvg.vue'
import KarelWorldMap from '../KarelWorldMap.vue'
import KarelArrows from '../KarelArrows.vue'

const copy = x => JSON.parse(JSON.stringify(x))

export default {
  name: 'task-player',
  components: { KarelBlockly, KarelPython, KarelWorldRenderer, KarelBlocklyPlayerAndControls, StoneAndNumber, KarelWorldMap, KarelArrows },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    const task = copy(this.$store.getters.content(this.id))
    if (task.karelBlockly && !task.karelBlockly.worldWorkspace) {
      task.karelBlockly.worldWorkspace = '<xml xmlns="https://developers.google.com/blockly/xml"><block type="karel_world_main" id="world_main" deletable="false" x="44" y="0"></block><block type="karel_world_end_conditions" id="world_end_conditions" deletable="false" x="44" y="100"></block></xml>'
    }
    const { karelBlockly, agents } = task
    karelBlockly.settings.customizerMode = false

    const agentTabs = []
    if (agents) {
      for (const agent of agents) {
        if (agent.showTab) {
          agentTabs.push(agent)
        }
      }
    }

    return {
      isPython: task.isPython,
      pythonCode: task.pythonCode,
      worldPython: task.worldPython,
      karelBlockly,
      currentStepData: null,
      playing: false,
      stepSpeed: 5,
      activeScenarioIndex: 0,
      correctScenarios: new Array(task.worlds.length).fill(null),
      pythonError: { message: '', line: 0 },
      pythonHighlights: {},
      activeRoom: { row: 0, col: 0 },
      showLimits: false,
      agents,
      agentTabs,
      activeEditorTab: 0,
      directions: [false, false, false, false]
    }
  },
  watch: {
    async codeSolvesWorld(isCorrect) {
      if (isCorrect) {
        if (this.task.maxBlocks && this.blocksUsed > this.task.maxBlocks) {
          await taskTooManyBlocksSwal()
          return
        }

        this.correctScenarios[this.activeScenarioIndex] = true
        const incompleteScenarios = this.correctScenarios.filter(d => !d).length
        if (incompleteScenarios) await taskPartialSuccessSwal(incompleteScenarios)
      }
      else if (this.error) {
        this.correctScenarios[this.activeScenarioIndex] = false
        await taskIncorrectSwal(this.error)
      }
      else if (isCorrect === null) { /* waiting... */ }
      else {
        this.correctScenarios[this.activeScenarioIndex] = false
        await taskIncorrectSwal()
      }
    },
    'karelBlockly.workspace'() {
      this.correctScenarios = new Array(this.task.worlds.length).fill(null)
    },
    'currentStepData.activeBlocks'(blocks) {
      this.karelBlockly = {
        ...this.karelBlockly,
        highlight: JSON.parse(JSON.stringify(blocks || []))
      }
    },
    activeScenarioIndex() {
      this.playing = false
      this.currentStepData = null
      this.activeRoom = { row: 0, col: 0 }
    },
    correctScenarios: {
      deep: true,
      async handler(val) {
        if (val.every(val => val)) {
          await taskSuccessSwal()
          // TODO: Think about how to get rid of this delay haaaack
          // which is needed because of sweetaltert using
          // a body style !important to get its transition to work
          await new Promise( res => setTimeout(res, 260))
          this.$emit('taskCorrect')
        }
      }
    },
    playing() {
      if (this.playing) {
        this.pythonError.line = 0
      }

      this.directions[0] = false
      this.directions[1] = false
      this.directions[2] = false
      this.directions[3] = false
    }
  },
  computed: {
    task() { return this.$store.getters.content(this.id) },
    blocksUsed() { return (this.karelBlockly.workspace.match(/block /g) || []).length },
    activePreWorld() {
      return this.task.worlds[this.activeScenarioIndex].preWorld
    },
    activePostWorld() {
      return this.task.worlds[this.activeScenarioIndex].postWorld
    },
    world() {
      return this.currentStepData ? this.currentStepData.world : this.activePreWorld
    },
    codeCompletelyRun() {
      if (this.currentStepData) {
        const { isDone, error } = this.currentStepData
        return !!(isDone || error)
      }
      else return false
    },
    error() {
      return this.currentStepData ? this.currentStepData.error : null
    },
    codeSolvesWorld() {
        if (!this.codeCompletelyRun) return null
        else if (this.error) return false
        else return this.currentStepData.world.endConditions ? this.currentStepData.isDone : worldsMatch(this.currentStepData.world, this.activePostWorld)
    },
    finalSettings() {
      const nameMap = {
        'karel_move': 'karel.move',
        'karel_turn': 'karel.turnLeft',
        'karel_place': 'karel.placeStone',
        'karel_pickup': 'karel.pickupStone',
        'karel_while': 'while loops',
        'karel_define': 'functions',
        'karel_variable': 'variables'
      };

      const settings = Object.entries(this.karelBlockly.settings.blocks).filter(([, value]) => value.active)
      const final = settings.map(([key, value]) => {
        return { name: nameMap[key] || key, limit: value.limit === -1 ? '∞' : value.limit }
      })
      return final;
    },
    agentWorkspaces() {
      const workspaces = {}

      if (this.agents) {
        for (const agent of this.agents) {
          workspaces[agent.id] = agent.workspace
        }
      }

      return workspaces;
    },
    agentPythonCodes() {
      const codes = {}

      if (this.agents) {
        for (const agent of this.agents) {
          codes[agent.id] = agent.pythonCode
        }
      }

      return codes
    }
  },
  methods: {
    getScenarioLabel(i) {
      const start = `Scenario ${i+1}: `
      let end = 'Not Tried'
      if (this.correctScenarios[i]) end = 'Solved'
      else if (this.correctScenarios[i] === false) end = 'Not Solved'
      return start + end
    },
    showHint() { taskHintSwal(this.task.hint) },
    resetTask() {
      const { karelBlockly } = this.task
      this.karelBlockly = copy(karelBlockly)
      this.playing = false
      this.currentStepData = null
    },
    errorCallback(id, error) {
      this.pythonError.id = id
      this.pythonError.message = error.message
      this.pythonError.line = error.line
    },
    highlight(id, line) {
      this.pythonHighlights[id] = line
    }
  },
}
</script>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 100%;
}
.left-col {
  flex: 2 0 300px;
  margin: 2px 2px 0 4px;
  display: flex;
  flex-direction: column;
}
.right-col {
  flex: 1 0 500px;
}
.left-col .instructions-and-reset-wrapper {
  display: flex;
  justify-content: space-between;
}
.tab-wrapper {
  display:flex;
  align-items: center;
  font-size:1.3rem;
  height: 2.6rem;

  width: 100%;
  background: #EEEEEE;
  border-bottom: 1px solid #AAAAAA;
}
.example-label {
  display: flex;
  height: 100%;
  align-items: center;
  cursor: pointer;
  margin-left: 2px;
  margin-right: 20px;
  padding-left: 4px;
  padding-right: 4px;
}
.example-icon {
  font-size: 0.8rem;
  margin-right: 5px;
}

.karel-button.reset {
  background: darkred;
}

.left-col .instructions-box {
  width: 300px;
  background: lightblue;
  border-radius: 6px;
  padding: 10px;
}
.left-col .instructions-box .max-blocks-p {
  background: lightsalmon;
  padding: 6px;
  border-radius: 6px;
  margin: 4px 0 0 0;
}

.left-col .world-wrapper {
  display: flex;
  min-height: 300px;
  max-height: 300px;
  margin: 10px 0;
}
.left-col .controls-wrapper {
  height: 82px;
}
.left-col .karel-button.hint {
  background: purple;
  margin-top: 4px;
}


.scenario-selector {
  display: flex;
}
.scenario {
  margin-right: 20px;
  font-size: 1.2rem;
  border-radius: 0.3rem;
  padding: 0.4rem;
}
.scenario.active {
  font-weight: bold;
}
.scenario.correct {
  background: lightgreen;
}
.scenario.incorrect {
  background: #fcccbc;
}


.kb-select-area {
  display: flex;
  justify-content: flex-end;
}
.kb-select-button {
  cursor: pointer;
  margin: 2px 6px;
  color: #4183c4;
  background-color: #fff;
  border-radius: .25rem;
  padding: .5rem 1rem;
  border: solid #007bff 2px;
}
.kb-select-button.active {
  color: #fff;
  background-color: #007bff;
}
</style>