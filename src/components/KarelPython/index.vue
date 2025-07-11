<script setup>
import { computed, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import * as monaco from 'monaco-editor';
import KarelTabs from '../KarelTabs.vue';

/*
 * Task ids:
 * 3057cf71-42be-4ead-ab20-683f8e085efb
 * 3d001131-390b-4165-8f3b-6a931155c34d
 * 762deb0b-7746-471f-b654-352db9063b4f
 * f854542e-2b21-4d4c-bdae-1efa2a2be3a3
 * 36bf25a6-8b78-46f9-a727-5c445687a780
 * a4584446-8ec9-4cc6-8a2c-88f298dfbaed
 * a9b2a855-76ac-4851-9c7c-4fad804c6cb8
 * 61cb8143-4c52-4e65-bc59-6b28b2999f8a
 */

const props = defineProps({
  consoleText: String,
  highlights: Object,
  error: Object,
  readonly: Boolean,
  runningTab: Number,
  hasWorld: Boolean,
  showConsole: Boolean
});

const code = defineModel('code');
const world = defineModel('world');
const agents = defineModel('agents');
const activeTab = defineModel('activeTab');

const editorDiv = ref();

let instance;
const models = {};
const states = {};

let lines = {};
let decorations = null;

const consoleFinalText = computed(() => {
  return `Karel output:\n${props.consoleText ?? ''}`;
});

const createModel = (id) => {
  if (id === 0) {
    models[id] = monaco.editor.createModel(code.value ?? '', 'python');

    models[id].onDidChangeContent(() => {
      code.value = instance.getValue();
    });
  } else if (id === -1) {
    models[id] = monaco.editor.createModel(world.value ?? '', 'python');

    models[id].onDidChangeContent(() => {
      world.value = instance.getValue();
    });
  } else {
    const agent = agents.value.filter((agent) => agent.id === id)[0];

    models[id] = monaco.editor.createModel(agent.pythonCode ?? '', 'python');

    models[id].onDidChangeContent(() => {
      agent.pythonCode = instance.getValue();
    })
  }
}

const finalTabs = computed((previousTabs) => {
  const tabs = {
    0: {
      id: 0,
      name: 'Karel',
      code
    }
  };

  if (props.hasWorld) {
    tabs[-1] = {
      id: -1,
      name: 'World',
      code: world.value
    }
  }

  if (agents.value) {
    for (const agent of agents.value) {
      tabs[agent.id] = {
        id: agent.id,
        name: agent.name,
        code: ''
      }
    }
  }

  // Update models and states.
  if (previousTabs) {
    const previousIds = Object.values(previousTabs).map((tab) => tab.id);
    const newIds = Object.values(tabs).map((tab) => tab.id);

    for (const previousId of previousIds) {
      if (newIds.every((id) => id !== previousId)) {
        if (activeTab.value === previousId)
        {
          activeTab.value = 0;
        }

        models[previousId].dispose();
        delete models[previousId];
        delete states[previousId];
      }
    }

    for (const newId of newIds) {
      if (previousIds.every((id) => id !== newId)) {
        createModel(newId);
      }
    }
  }

  return tabs;
});

onMounted(() => {
  instance = monaco.editor.create(editorDiv.value, {
    value: code.value,
    language: 'python',
    model: null,
    automaticLayout: true,
    renderValidationDecorations: 'on'
  });

  for (const tab of Object.values(finalTabs.value)) {
    createModel(tab.id);
  }

  instance.setModel(models[activeTab.value]);
});

const errorModelId = ref();
watch(() => props.error, (error) => {
  if (instance) {
    if (error.line === 0) {
      monaco.editor.setModelMarkers(models[errorModelId.value], 'python', []);
      errorModelId.value = null;
      return;
    }

    errorModelId.value = parseInt(error.id);
    activeTab.value = errorModelId.value;
    monaco.editor.setModelMarkers(models[errorModelId.value], 'python', [{
      startLineNumber: error.line,
      startColumn: 1,
      endLineNumber: errorModelId.value,
      endColumn: models[errorModelId.value].getLineMaxColumn(error.line) + 1,
      message: error.message,
      severity: monaco.MarkerSeverity.Error
    }]);
  }
}, { deep: true });

watch(() => props.highlights, (highlights) => {
  if (instance) {
    if (decorations) {
      decorations.clear();
      decorations = null;
    }

    lines = structuredClone(toRaw(highlights));

    if (highlights[activeTab.value] == null || highlights[activeTab.value] === 0) {
      return;
    }

    decorations = instance.createDecorationsCollection([{
      range: new monaco.Range(highlights[activeTab.value], 1, highlights[activeTab.value], 1),
      options: {
        isWholeLine: true,
        className: 'line-highlight'
      }
    }]);
  }
}, { deep: true });

watch(() => activeTab.value, (newActiveTab, previousActiveTab) => {
  if (Object.values(finalTabs.value).some((tab) => tab.id === previousActiveTab)) {
    states[previousActiveTab] = instance.saveViewState();
  }

  instance.setModel(models[newActiveTab]);

  instance.updateOptions({ readOnly: props.readonly && newActiveTab !== 0 && !agents.value.filter((agent) => agent.id === newActiveTab)[0].allowEdit });

  if (states[newActiveTab]) {
    instance.restoreViewState(states[newActiveTab]);
  }

  if (lines[newActiveTab] > 0) {
    if (decorations) {
      decorations.clear();
    }

    decorations = instance.createDecorationsCollection([{
      range: new monaco.Range(lines[newActiveTab], 1, lines[newActiveTab], 1),
      options: {
        isWholeLine: true,
        className: 'line-highlight'
      }
    }]);
  }
});

onUnmounted(() => {
  for (const tab of Object.values(finalTabs.value)) {
    if (decorations) {
      decorations.clear();
    }

    models[tab.id].dispose();
  }
});
</script>

<template>
  <div class="container">
    <KarelTabs
      v-if="Object.keys(finalTabs).length > 1"
      v-model="activeTab"
      :tabs="finalTabs"
      :runningTab="runningTab"
      :errorTabId="errorModelId"
    />
    <div class="container">
      <div ref="editorDiv" class="editor"></div>
      <pre v-if="showConsole" class="console">{{ consoleFinalText }}</pre>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
}

.editor {
  width: 100%;
  flex: 1;
}

.console {
  width: 100%;
  height: 100px;

  box-sizing: border-box;
  padding: 5px;

  white-space: pre-wrap;
  overflow-y: auto;

  background-color: black;
  color: white;
}
</style>

<!-- Style for line highlighting in the editor. Needs to be global. -->
<style>
.line-highlight {
  background-color: deepskyblue;
}
</style>
