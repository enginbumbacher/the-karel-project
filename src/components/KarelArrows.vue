<script setup>
import { onMounted, onUnmounted } from 'vue';

const directions = defineModel();

const registerDirection = (direction) => {
  directions.value[direction] = true;
};

const keys = {'ArrowUp': 0, 'ArrowLeft': 1, 'ArrowDown': 2, 'ArrowRight': 3};

const keydownCallback = (event) => {
  event.preventDefault();

  if (event.key in keys) {
    const direction = keys[event.key];
    registerDirection(direction);
  }
}

onMounted(() => {
  window.addEventListener('keydown', keydownCallback);
});

onUnmounted(() => {
  window.removeEventListener('keydown', keydownCallback);
});
</script>

<template>
  <div id="container">
    <button
      v-for="registered, i in directions"
      :key="`arrow${i}`"
      :id="`arrow${i}`"
      class="arrow"
      :style="{
        backgroundColor: registered ? 'gray' : 'white',
        gridRow: i === 3 ? 2 : i + 1,
        gridColumn: i === 0 ? 2 : i
      }"
      @click="() => registerDirection(i)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <g :transform="`rotate(-${i * 90} 16 16)`">
          <line x1="16" y1="5" x2="16" y2="27" stroke="black" />
          <line x1="16" y1="5" x2="5" y2="15" stroke="black" />
          <line x1="16" y1="5" x2="27" y2="15" stroke="black" />
        </g>
      </svg>
    </button>
  </div>
</template>

<style scoped>
#container {
  padding: 0;

  display: grid;
  gap: 0;

  width: 96px;
  height: 96px;

  grid-template-rows: repeat(3, 32px);
  grid-template-columns: repeat(3, 32px);
}

.arrow {
  padding: 0;
  margin: 0;

  border: 1px solid black;
}

</style>
