<template>
  <div class="container">
    <div v-if="playing">
      <button class="karel-button" @click="$emit('pause')">pause</button>
    </div>
    <div v-else-if="currentStepData && currentStepData.error">
      <button class="karel-button" @click="reset">reset</button>
    </div>
    <div v-else-if="playingTerminated">
      <button class="karel-button" @click="reset">reset</button>
    </div>
    <div v-else>
      <button class="karel-button" @click="$emit('play')">play</button>
      <button class="karel-button" v-if="paused" @click="reset">reset</button>
    </div>

    <div v-if="!playingTerminated && !playing">
      <button class="karel-button" @click="stepByStep">step</button>
    </div>

    <div v-if="karelBlocklyWorld">
        <table class="karel-variables">
            <tr v-for="(varData, varName) in karelBlocklyWorld.karel.variables">
                <td>{{ `${varData.func ? varData.func + ': ' : ''}${varName}` }}</td>
                <td>{{ varData.value }}</td>
            </tr>
        </table>
    </div>

    <div class="play-speed-wrapper">
      <span><strong>Play Speed</strong></span>
      <input
        type="range"
        min="1" max="26" step="1" :value="stepSpeed"
        @change="$emit('setStepSpeed', parseInt($event.target.value))"
      />
      <div class="speed-labels-row">
        <span>(slow)</span>
        <span>(fast)</span>
      </div>
    </div>

  </div>
</template>

<script>
  import KarelBlocklyWorld from "./KarelBlocklyWorld"
  import { asyncRun } from './KarelBlocklyWorld/PythonWorker/workerInterface'
  export default {
    props: [ 'playing', 'stepSpeed', 'preWorld', 'workspace', 'worldWorkspace', 'toolbox', 'isPython', 'pythonCode', 'worldPython', 'errorCallback', 'highlight', 'settings', 'agentWorkspaces', 'agentPythonCodes', 'directions' ],
    data() {
      return {
        karelBlocklyWorld: null,
        currentStepData: null
      }
    },
    watch: {
      playing() {
        if (this.playing) {
          if (this.karelBlocklyWorld) this.step()
          else {
            const { preWorld, toolbox, workspace, worldWorkspace, isPython, pythonCode, worldPython, settings, agentWorkspaces } = this

            if (isPython) {
              const translatePython = async () => {
                try {
                  let totalCode = '';
                  const hasWorld = settings.blocks.karel_events.active;
                  const minAgentId = Object.keys(this.agentPythonCodes).length > 0 ? parseInt(Object.keys(this.agentPythonCodes)[0]) : 0;

                  // Translate agents.
                  for (const agentId of Object.keys(this.agentPythonCodes)) {
                    const script = this.agentPythonCodes[agentId]
                    const context = JSON.parse(JSON.stringify({ ...settings, currentId: parseInt(agentId), hasWorld, minAgentId }))
                    const { results, error } = await asyncRun(script, context)
                    if (results) {
                      if (results.type === 'success') {
                        totalCode += results.code;
                      } else {
                        this.reset()
                        this.errorCallback(agentId, results)
                        return;
                      }
                    } else if (error) {
                      console.error('pythonWorker error:', error);
                      this.reset()
                      return;
                    }
                  }

                  // Translate world.
                  let pythonEndConditions;
                  if (hasWorld) {
                    const script = worldPython
                    const context = JSON.parse(JSON.stringify({ ...settings, currentId: -1, hasWorld, minAgentId }))
                    const { results, error } = await asyncRun(script, context)
                    if (results) {
                      if (results.type === 'success') {
                        totalCode += results.code;
                        pythonEndConditions = results.endConditions;
                      } else {
                        this.reset()
                        this.errorCallback(-1, results)
                        return;
                      }
                    } else if (error) {
                      console.error('pythonWorker error:', error);
                      this.reset()
                      return;
                    }
                  }

                  // Translate Karel.
                  const script = pythonCode
                  const context = JSON.parse(JSON.stringify({ ...settings, currentId: 0, hasWorld, minAgentId }))
                  const { results, error } = await asyncRun(script, context)
                  if (results) {
                    if (results.type === 'success') {
                      totalCode += results.code;
                    } else {
                      this.reset()
                      this.errorCallback(0, results)
                      return;
                    }
                  } else if (error) {
                    console.error('pythonWorker error:', error);
                    this.reset()
                    return;
                  }

                  this.karelBlocklyWorld = KarelBlocklyWorld(preWorld, { toolbox, workspace, worldWorkspace, isPython, pythonCode: totalCode, pythonEndConditions, highlight: this.highlight, directions: this.directions })
                  this.step(this.stopOnFirstStep)
                  this.stopOnFirstStep = false
                } catch (e) {
                  console.error(`Error in pythonWorker at ${e.filename}, line ${e.lineno}: ${e.message}`);
                }
              }
              translatePython()
            } else {
              this.karelBlocklyWorld = KarelBlocklyWorld(preWorld, { toolbox, workspace, worldWorkspace, isPython, pythonCode, agentWorkspaces, directions: this.directions})
              this.step(this.stopOnFirstStep)
              this.stopOnFirstStep = false
            }
          }
        }
        else if (this.nextStep) clearTimeout(this.nextStep)
      },
      preWorld()  { this.reset() },
      workspace() { this.reset() },
    },
    computed: {
      playingTerminated() {
        if (this.currentStepData && this.currentStepData.isDone) return true
        return false
      },
      paused() {
        return this.currentStepData && !this.playingTerminated && !this.playing
      }
    },
    methods: {
      reset() {
        this.stopOnFirstStep = false
        this.karelBlocklyWorld = null
        this.currentStepData = null
        this.$emit('step', null)
        this.$emit('pause')
      },
      step(stepByStep = false) {
        this
          .karelBlocklyWorld
          .step(this.currentStepData ? this.currentStepData.step + 1 : 0)
          .then( stepData => {
            this.currentStepData = stepData
            this.$emit('step', stepData)
            if (stepData.isDone || stepData.error || stepByStep) this.$emit('pause')
            else this.nextStep = setTimeout(() => this.step(), 1000/this.stepSpeed)
          })
          .catch(error => {
            console.warn(error)
          })
      },
      stepByStep() {
        if (!this.karelBlocklyWorld) {
          this.stopOnFirstStep = true;
          this.$emit('play');
        }
        else this.step(true)
      }
    }
  }
</script>

<style scoped>
.container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.play-speed-wrapper {
    display: flex;
    color: #777;
    height: 60px;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid lightgrey;
}
.play-speed-wrapper .speed-labels-row {
    display: flex;
    width: 100%;
    color: #888;
    font-size: 0.8rem;
    justify-content: space-between;
}
.play-speed-wrapper input {
    appearance: none;
    background: none;
    border: 2px solid gainsboro;
}

.karel-variables {
    border-collapse: collapse;
    border: 1px solid #A55B80;
    margin-top: 10px;
    font-size: 0.8rem;
}

.karel-variables td {
    border: 1px solid #A55B80;
    padding: 2px 4px;
}

</style>