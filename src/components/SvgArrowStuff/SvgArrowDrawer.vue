<template>
  <g
    @mousedown="dragstart"
    @mousemove="drag"
    @mouseup="drop"
  >
    <rect
      :x="x"
      :y="y"
      :width="width"
      :height="height"
      fill="rgba(0,0,0,0)"
      stroke="none"
    />
    <SvgArrow
      v-if="to"
      :from="from"
      :to="to"
    />
  </g>
</template>

<script>

import SvgArrow from './SvgArrow.vue'

export default {
  components: { SvgArrow },
  props: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 }
  },
  data() {
    return {
      active: false,
      from: null,
      to: null
    }
  },
  methods: {
    dragstart() {
      this.active = true
    },
    drag(event) {
      if (this.active) {
        const x = event.offsetX
        const y = event.offsetY
        if (this.from === null) {
          this.from = {x,y}
          this.$emit('start', {x,y})
        }
        else {
          this.to = {x,y}
          this.$emit('move', {x,y})
        }
      }
    },
    drop() {
      this.active = false
      this.from = null
      this.to = null
      this.$emit('end')
    }
  }
}

</script>