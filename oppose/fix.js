var Module = Module || {};

Module.dynamicLibraries = Module.dynamicLibraries || [];

// stub missing engine DLL exports
Module.__EMSCRIPTEN_FUNCTIONS_STUBS = {
  GiveFnptrsToDll: function(engineFuncs, globals) {
    console.log("Stub: GiveFnptrsToDll");
  },

  GetEntityAPI2: function(pFunctionTable, version) {
    console.log("Stub: GetEntityAPI2");
    if (version) HEAP32[version >> 2] = 140;
    return 1;
  },

  GetNewDLLFunctions: function(pFunctionTable, version) {
    console.log("Stub: GetNewDLLFunctions");
    return 1;
  }
};