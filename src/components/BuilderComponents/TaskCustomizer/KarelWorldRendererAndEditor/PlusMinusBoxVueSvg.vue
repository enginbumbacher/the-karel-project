<template>
  <svg viewBox="0 0 10 10">
    <rect
      x=".25"
      y=".25"
      width="9.5"
      height="9.5"
      stroke-width="0.5"
      stroke="grey"
      rx="1"
      ry="1"
      fill="white"
    />
    <path
      d="M 5 2 l 3 3 l -3 3 l -3 -3 z"
      :fill="color"
      :opacity="opacity"
    />
    <g stroke="white" stroke-width="0.35">
      <path v-if="symbol" d="M 5 5 l -1 0 l 2 0" />
      <!-- vertical bar shown only if 'plus' -->
      <path v-if="symbol === 'plus'" d="M 5 5 l 0 -1 l 0 2" />
    </g>
  </svg>
</template>

<script>
export default {
  name: 'plus-or-minus-button',
  props: {
    symbol: {
      type: String,
      required: false,
      validator: val => [ 'plus', 'minus' ].includes(val),
      default: 'plus',
    },
    opacity: {
      type: Number,
      required: false,
      default: 1,
    },
    color: {
      type: String,
      required: false,
      default: "blue"
    }
  }
}
</script>