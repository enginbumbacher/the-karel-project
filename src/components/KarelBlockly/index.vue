<template>
  <div class="wrapper">
    <div v-if="settings.blocks.karel_events.active" class="tabs-container">
      <div class="tab" @click="() => activeTab = 'karel'">Karel</div>
      <div class="tab" @click="() => activeTab = 'world'">World</div>
    </div>
    <div class="container" ref="karelContainer"
      :style="{ 'pointer-events': settings.disabled ? 'none' : 'auto', display: activeTab === 'karel' ? 'block' : 'none' }"
    />
    <div id="worldContainer" class="container" ref="worldContainer"
      :style="{ 'pointer-events': settings.disabled ? 'none' : 'auto', display: activeTab === 'world' ? 'block' : 'none' }"
    />
  </div>
</template>


<script>
import Blockly from 'blockly'
import * as en from 'blockly/msg/en'
import enTranslations from '../../helpers/karelTranslationsEN.js'
import initializeKarelBlocks from '../../helpers/initializeKarelBlocks.js'
  
Blockly.setLocale({ ...en, ...enTranslations })
initializeKarelBlocks(Blockly)

const generateToolbox = ({
  karel_move=true,
  karel_turn=true,
  karel_place=true,
  karel_pickup=true,
  karel_if=true,
  karel_ifelse=true,
  karel_variable=true,
  karel_repeat=true,
  karel_while=true,
  karel_define=true,
  karel_events=true,
  custom=''
}={}) => `
  <xml>
    ${ custom || '' }
    ${ karel_move ? `<Block type="karel_move" id="karel_move" />` : '' }
    ${ karel_turn ? `<Block type="karel_turn_left" id="karel_turn" />` : '' }
    ${ karel_place ? `<Block type="karel_place_stone" id="karel_place" />` : '' }
    ${ karel_pickup ? `<Block type="karel_pickup_stone" id="karel_pickup" />` : '' }
    ${ karel_if ? `<Block type="karel_if_dropdown" id="karel_if" />` : '' }
    ${ karel_ifelse ? `
        <Block type="karel_ifelse" id="karel_ifelse" />
        <Block type="controls_if" id="karel_nativeifelse" />
        ` : '' }
  ${
    // From https://github.com/google/blockly/tree/master/blocks
    karel_variable ? `
    <Block type="variables_get" id="karel_variableget" />
    <Block type="variables_set" id="karel_variableset" />
    <Block type="logic_compare" id="karel_compare" />
    <Block type="logic_operation" id="karel_logicop" />
    <Block type="logic_negate" id="karel_neg" />
    <Block type="math_number" id="karel_number" />
    <Block type="math_arithmetic" id="karel_arithmetic" />
    ` : ''
  }
    ${ karel_repeat ? `
        <Block type="controls_repeat_ext" id="karel_repeat">
          <Value name="TIMES">
              <Shadow type="math_number">
              <Field name="NUM">10</Field>
              </Shadow>
            </Value>
          </Block>
        ` : ''
    }
    ${ karel_while ?`
    <Block type="karel_while_dropdown" id="karel_while" />
    <Block type="controls_whileUntil" id="karel_nativewhile" />
    ` : '' }
    ${ karel_define ? `
    <Block type="procedures_defnoreturn" id="karel_define" />
    <Block type="procedures_defreturn" id="karel_definereturn" />
    ` : '' }
    ${ karel_events ? `
    <Block type="karel_is_key_pressed" id="karel_is_key_pressed" />
    <Block type="karel_on_key_press" id="karel_on_key_press" />
    <Block type="math_random_int" id="karel_random" />
    <Block type="karel_wait" id="karel_wait" />
    <Block type="karel_world_fail" id="karel_world_fail" />
    <Block type="karel_world_success" id="karel_world_success" />
    <Block type="karel_stone_count" id="karel_stone_count" />
    <Block type="karel_world_stone_count" id="karel_world_stone_count" />
    <Block type="karel_world_spawn_stone" id="karel_world_spawn_stone" />
    ` : '' }
  </xml>
`
//  map for convenience so we can have friendly names in settings
const settingNameToTypeName = {
  karel_move: 'karel_move',
  karel_turn: 'karel_turn_left',
  karel_place: 'karel_place_stone',
  karel_pickup: 'karel_pickup_stone',
  karel_if: 'karel_if_dropdown',
  karel_ifelse: 'karel_ifelse',
  karel_variable: 'karel_variable',
  karel_repeat: 'controls_repeat_ext',
  karel_while: 'karel_while_dropdown',
  karel_define: 'procedures_defnoreturn',
  karel_events: 'karel_events'
}

// path data for lock/unlock icons from font-awesome, creative commons
const unlockedPathData = "M400 256H152V152.9c0-39.6 31.7-72.5 71.3-72.9 40-.4 72.7 32.1 72.7 72v16c0 13.3 10.7 24 24 24h32c13.3 0 24-10.7 24-24v-16C376 68 307.5-.3 223.5 0 139.5.3 72 69.5 72 153.5V256H48c-26.5 0-48 21.5-48 48v160c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z"
const lockedPathData = "M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"
const SVG_LOCK_PATH =  "M7.715,4.929v3.857c0,0.179-0.063,0.331-0.188,0.456S7.25,9.429,7.071,9.429H0.644c-0.179,0-0.331-0.063-0.456-0.188S0,8.964,0,8.786V4.929c0-0.179,0.063-0.33,0.188-0.456c0.125-0.125,0.277-0.188,0.456-0.188h0.214V3c0-0.821,0.295-1.527,0.884-2.116C2.331,0.295,3.036,0,3.857,0s1.526,0.295,2.116,0.884C6.563,1.473,6.857,2.179,6.857,3v1.286h0.214c0.179,0,0.331,0.063,0.456,0.188C7.652,4.599,7.715,4.75,7.715,4.929z M2.144,4.286h3.428V3c0-0.473-0.167-0.877-0.502-1.212S4.33,1.286,3.857,1.286c-0.474,0-0.877,0.167-1.212,0.502S2.144,2.527,2.144,3V4.286z M4.715,6c0-0.236-0.084-0.438-0.251-0.606c-0.168-0.167-0.37-0.251-0.606-0.251S3.419,5.227,3.251,5.394C3.084,5.562,3,5.764,3,6c0,0.166,0.043,0.315,0.128,0.449c0.084,0.134,0.198,0.239,0.341,0.315L3.007,8.297C2.984,8.364,2.996,8.427,3.04,8.484c0.045,0.058,0.103,0.087,0.175,0.087H4.5c0.071,0,0.13-0.029,0.175-0.087C4.719,8.427,4.73,8.364,4.708,8.297L4.246,6.764c0.143-0.076,0.256-0.181,0.341-0.315S4.715,6.166,4.715,6z"

const setAttributes = (svgEl, attrs) => Object.entries(attrs).forEach(([name, value]) => svgEl.setAttribute(name, value))
const connectionInLockedProcedure = connection => {
  const block = connection.getSourceBlock()
  if (!block.isEditable()) return true
  const parentBlock = block.getParent()
  if (parentBlock) return !parentBlock.isEditable()
  else return false
}

const lockProcedureBlock = (block, isLocked) => {
  //  block.setMovable(!isLocked) /* only descendants need to be immovable */
  block.setEditable(!isLocked)
  block.setDeletable(!isLocked)
  block
    .getDescendants()
    .forEach( b => {
      b.setMovable(!isLocked)
      b.setEditable(!isLocked)
      b.setDeletable(!isLocked)
    })
}

export default {
  name: 'karel-blockly',
  props: [ 'settings', 'toolbox', 'workspace', 'worldWorkspace', 'highlight' ],
  data() {
    return {
      activeTab: 'karel'
    }
  },
  mounted() {
    this.workspaces = { karel: null, world: null }
    this.$emit('update:toolbox', generateToolbox(this.activeBlocks))
    this.instantiateBlockly();

    // Trick to wait for the world container to be displayed before instantiating the Blockly workspace
    // Otherwise it would not fill the available space and coult not be used
    const thisRef = this;
    const observer = new MutationObserver(function(mutations, observer) {
      mutations.forEach(function(mutationRecord) {
        if (mutationRecord.target.style.display === 'block') {
          thisRef.instantiateBlockly()
          observer.disconnect();
        }
      });
    });
    const target = document.getElementById('worldContainer');
    observer.observe(target, { attributes: true, attributeFilter: ['style'] })
  },
  beforeUnmount() {
    this.workspaces.karel?.instance?.dispose()
    this.workspaces.world?.instance?.dispose()
  },
  watch: {
    injectedToolbox(n, o) {
      if (n === null || o === null) this.instantiateBlockly(this.activeTab)
      else {
        this.workspaces.karel?.instance?.updateToolbox(this.injectedToolbox)
        this.workspaces.world?.instance?.updateToolbox(this.injectedToolbox)
      }
      this.updateChips()
    },
    settings: {
      deep: true,
      handler() {
        this.$emit('update:toolbox', generateToolbox(this.activeBlocks))
        this.instantiateBlockly()
      }
    },
    'settings.customizerMode'() {
      this.instantiateBlockly()
    },
    highlight(n, o) {
      o && o.forEach(id => this.workspaces[this.activeTab].instance.highlightBlock(id, false))
      n && n.forEach(id => this.workspaces[this.activeTab].instance.highlightBlock(id, true))
    },
    blocksUsedByType() { this.updateChips() },
  },
  computed: {
    injectedToolbox() {
      return this.settings.showToolbox ? this.toolbox : null;
    },
    blocksUsedByType() {
    const blocksUsedByType = {}
      Object.entries(settingNameToTypeName).forEach(([settingName, blockType]) => {
        var count = (this.workspace.match(new RegExp(blockType, 'g')) || []).length
        blocksUsedByType[settingName] = count
      })
      return blocksUsedByType
    },
    maxInstances() {
      // desired form { 'karel_move' : 4, ... }
      let maxInstances = {}
      Object.entries(this.settings.blocks).forEach(([name,{ active, limit }]) => {
        if (active && limit !== -1) maxInstances[settingNameToTypeName[name]] = limit
      })
      return maxInstances
    },
    activeBlocks() {
      //  goal: convert object like { karel_move: { active: true, limit: -1 }, ... }
      //  to object like { karel_move: true, karel_turn: false, }
      let activeBlocks = {}
      Object
        .entries(this.settings.blocks)
        .forEach(([blockName, blockInfo]) => activeBlocks[blockName] = blockInfo.active)
      return activeBlocks
    }
  },
  methods: {
    instantiateBlockly() {
      if (!this.workspaces[this.activeTab]) this.workspaces[this.activeTab] = { instance: null }
      if (this.workspaces[this.activeTab].instance) this.workspaces[this.activeTab].instance.dispose()
      // define and inject Blockly instance
      this.workspaces[this.activeTab].instance = Blockly.inject(this.$refs[`${this.activeTab}Container`], {
        toolbox: this.injectedToolbox,
        maxInstances: this.maxInstances,
        zoom: {
          controls: false,
          wheel: false,
          startScale: 0.82,
          maxScale: 0.82,
          minScale: 0.82,
          scaleSpeed: 1.2,
          pinch: false
        },
      })
      // Set Initial Workspace
      Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(this.activeTab === 'karel' ? this.workspace : this.worldWorkspace), this.workspaces[this.activeTab].instance)

      // Turn Off Right Clicking on the Workspace -- Unregister All Found Items in ContextMenuRegistry
      this.disableBlockContextMenus()

      // Add the initial individual "blocks left" chips.  Subseqent updates done by the watcher
      this.updateChips()

      // Attach Change Listeners
      this.workspaces[this.activeTab].instance.addChangeListener(this.blocklyChangeListeners)

      //  proxy connection checker logic so we can reject connections to locked blocks
      const originalCanConnect = this.workspaces[this.activeTab].instance.connectionChecker.canConnect
      this.workspaces[this.activeTab].instance.connectionChecker.canConnect = function (a, b) {
        if (connectionInLockedProcedure(a) || connectionInLockedProcedure(b)) return false
        else return originalCanConnect.apply(this, arguments)
      }
    },
    blocklyChangeListeners(e) {
      this.makeBlocksUndeletableIfToolboxHidden(e)
      this.updateWorkspace()
      this.updateToolbox()
      this.updateSvgLockIcons()
    },
    disableBlockContextMenus() {
      const { registry } = Blockly.ContextMenuRegistry
      const registryValues = Object.values(registry)
      const registryContent = Object.values(registryValues)[0]
      Object
        .values(registryContent)
        .forEach(item => registry.unregister(item.id))
    },
    updateWorkspace() {
      const newWorkspace = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(this.workspaces[this.activeTab].instance))
      this.$emit(`update:${this.activeTab === 'karel' ? 'workspace' : 'worldWorkspace'}`, newWorkspace)
    },
    makeBlocksUndeletableIfToolboxHidden(e) {
      if (e.type === 'finished_loading' && !this.settings.showToolbox && !this.settings.customizerMode) {
        const allBlocks = this.workspaces[this.activeTab].instance.getAllBlocks()
        allBlocks.forEach(block => block.setDeletable(false))
      }
    },
    updateSvgLockIcons() {
      const previousToDelete = document.querySelectorAll('.custom-lock-icon')
      previousToDelete.forEach(el => el.parentNode.removeChild(el) )

      const allFnBlocks = this.workspaces.karel.instance.getAllBlocks().filter(block => block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn')
      if (this.workspaces.world) {
        allFnBlocks.push(...this.workspaces.world.instance.getAllBlocks().filter(block => block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn'))
      }

      if (this.settings.customizerMode) {
        allFnBlocks
          .forEach( block => {
            const node = document.querySelector(`[data-id="${block.id}"`)
            const lock = document.createElementNS("http://www.w3.org/2000/svg", "g")
            const isLocked = !block.isEditable()

            const lockPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
            const lockCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle")

            setAttributes(lockPath,  { d: isLocked ? lockedPathData : unlockedPathData, fill: isLocked ? 'red' : 'green', transform: "translate(-6, 0) scale(0.03)", 'pointer-events': 'none'})
            setAttributes(lockCircle,{ cx: 4, cy: 5, r: 8, fill: 'lightgrey', transform: "translate(-7, 0) scale(1.7)" })
            lock.appendChild(lockCircle)
            lock.appendChild(lockPath)
            lock.classList.add("custom-lock-icon")
            node.appendChild(lock)

            lockProcedureBlock(block, isLocked)
            lockCircle.addEventListener("click", () => lockProcedureBlock(block, block.isEditable()))
          })
      }
      else {
        //  only apply styles to locked procedure blocks in this case where
        //  we aren't allowing editing of locked state
        allFnBlocks
          .filter(block => !block.isEditable())
          .forEach(block => {
            const node = document.querySelector(`[data-id="${block.id}"`)
            const lock = document.createElementNS("http://www.w3.org/2000/svg", "path")
            setAttributes(lock, { d: SVG_LOCK_PATH, fill: 'black', transform: "translate(7, 5) scale(1.5)" })
            lock.classList.add("custom-lock-icon")
            node.appendChild(lock)
          })
      }
    },
    updateChips() {
      // delete previous chips.. then add new
      const previousToDelete = document.querySelectorAll('.custom-block-counter')
      previousToDelete.forEach(el => el.parentNode.removeChild(el) )
      
      const toolboxBlockIds = Object.entries(settingNameToTypeName)
      toolboxBlockIds.forEach( ([ blockId ]) => {
        const node = document.querySelector(`[data-id="${blockId}"`)
        if (!node || this.settings.blocks[blockId].limit === -1) return //  TODO: should probably not look for blocks that aren't available
        const numLeft = this.settings.blocks[blockId].limit - this.blocksUsedByType[blockId]

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        setAttributes(rect, {x: -12, y: -8, width: 20, height: 20, rx: 4, fill: 'darksalmon'})
        rect.classList.add("custom-block-counter")
        
        const text = document.createElementNS("http://www.w3.org/2000/svg","text");
        setAttributes(text, {x: -6, y: 2, 'alignment-baseline': 'middle', 'vertical-align': 'middle', fill: 'white'})
        text.setAttributeNS(null,"font-size","14")
        text.classList.add("custom-block-counter")

        const textNode = document.createTextNode(numLeft)
        text.appendChild(textNode)
        
        node.appendChild(rect)
        node.appendChild(text)
      })
    },
    updateToolbox() {
      const procedures = Blockly.Procedures.allProcedures(this.workspaces.karel.instance)
      if (this.workspaces.world) {
        const worldProcedures = Blockly.Procedures.allProcedures(this.workspaces.world.instance)
        procedures[0].push(...worldProcedures[0])
        procedures[1].push(...worldProcedures[1])
      }
      const noreturnProcedures = procedures[0].map(
        ([name, parameters]) => `<Block type="procedures_callnoreturn"><mutation name="${name}">${
          parameters.map((parameter) => `<arg name="${parameter}" />`).join('')
        }</mutation></Block>`
      ).join('')
      const returnProcedures = procedures[1].map(
        ([name, parameters]) => `<Block type="procedures_callreturn"><mutation name="${name}">${
          parameters.map((parameter) => `<arg name="${parameter}" />`).join('')
        }</mutation></Block>`
      ).join('')
      const custom = noreturnProcedures.concat(returnProcedures)
      this.$emit('update:toolbox', generateToolbox({ ...this.activeBlocks, custom }))
    },
  }
}
</script>

<style scoped>
.wrapper { 
  position: relative;
  width: 100%;
  height: 100%;
}
.tabs-container {
  width: 100%;
  display: flex;
}
.tab {
  width: 100%;
  text-align: center;
  border: 1px solid grey;
  cursor: pointer;
  user-select: none;
}
.container {
  width: 100%;
  height: 100%;
}
</style>

<style>
  .blocks-remaining {
    position: absolute;
    bottom: 0; right: 0;
    padding: 10px;
    color: #666;
  }

/*
 * Hides the "cog" for blocks with mutator
 * Wanted for the function block
 * Not wanted for the ifelse block
 * g .blocklyIconGroup,
 * g .blocklyIconGroup + g {
 *   display: none;
 * }
 */
</style>