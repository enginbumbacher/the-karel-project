export default {
    name: "New Karel Task",
    instructions: '',
    hint: '',
    maxBlocks: null,
    worlds: [
        {
            preWorld: {
                nCols: 3,
                nRows: 3,
                karelRow: 2,
                karelCol: 0,
                karelDir: 'East',
                walls: [],
                stones: [],
                pickedStones: { blue: 0, red: 0 },
            },
            postWorld: {
                nCols: 3,
                nRows: 3,
                karelRow: 2,
                karelCol: 2,
                karelDir: 'East',
                walls: [],
                stones: [ { r: 2, c: 1, n: 1} ],
                pickedStones: { blue: 0, red: 0 },
            }
        }
    ],
    isPython: false,
    pythonCode: 'import karel\n\n# Enter your code here',
    worldPython: 'import karel\n\ndef world_main():\n    pass\n\ndef end_conditions():\n    pass\n',
    karelBlockly: {
        highlight: [],
        settings: {
            "blocks": {
                "karel_move": {
                    "active": true,
                    "limit": -1
                },
                "karel_turn": {
                    "active": true,
                    "limit": -1
                },
                "karel_place": {
                    "active": true,
                    "limit": -1
                },
                "karel_pickup": {
                    "active": true,
                    "limit": -1
                },
                "karel_ifelse": {
                    "active": false,
                    "limit": -1
                },
                "karel_variable": {
                    "active": false,
                    "limit": -1
                },
                "karel_repeat": {
                    "active": false,
                    "limit": -1
                },
                "karel_while": {
                    "active": false,
                    "limit": -1
                },
                "karel_define": {
                    "active": false,
                    "limit": -1
                },
                "karel_events": {
                    "active": false,
                    "limit": -1
                },
                "karel_agents": {
                  "active": false,
                  "limit": -1
                }
            },
            "showToolbox": true,
            "disabled": false,
            "customizerMode": false
        },
        workspace: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="karel_main" id="main" deletable="false" x="44" y="0"></block></xml>',
        worldWorkspace: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="karel_world_main" id="world_main" deletable="false" x="44" y="0"></block><block type="karel_world_end_conditions" id="world_end_conditions" deletable="false" x="44" y="100"></block></xml>',
        toolbox: `
            <xml>
              <Block type="karel_move" id="karel_move" />
              <Block type="karel_turn_left" id="karel_turn" />
              <Block type="karel_place_stone" id="karel_place" />
              <Block type="karel_pickup_stone" id="karel_pickup" />
            </xml>
          `
    },
    tags: {
        'customTags': [],
        'systemTags': [],
    }
}