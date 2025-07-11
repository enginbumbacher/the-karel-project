import { loadPyodide } from 'pyodide';
import parserPreTemplate from './parserTemplate.py?raw';
import karelFuncs from './karel.py?raw';

const parserTemplate = parserPreTemplate.replace('### KAREL_FUNCS ###', karelFuncs);

const loadPyodideAndPackages = async () => {
  self.pyodide = await loadPyodide();
};
const pyodideReady = loadPyodideAndPackages();

self.onmessage = async (event) => {
  await pyodideReady;

  const { id, python, ...context } = event.data;
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }

  try {
    // Generate the parser code
    const pythonCode = (python ?? "").replaceAll('\'', '"');
    const parser = parserTemplate.replace('### KAREL_CODE ###', pythonCode);

    // Generate JavaScript code
    await self.pyodide.loadPackagesFromImports(parser);
    const resultsProxy = await self.pyodide.runPythonAsync(parser);
    const results = resultsProxy.toJs({ dict_converter: Object.fromEntries});

    // Send the results back to the main thread
    self.postMessage({ results, id });
  } catch (error) {
    self.postMessage({ error: error.message, id });
  }
};
