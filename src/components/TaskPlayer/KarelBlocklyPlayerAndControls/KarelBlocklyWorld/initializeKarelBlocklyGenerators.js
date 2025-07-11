import 'blockly/javascript'

export default function initializeKarelBlocklyGenerators(Blockly) {
    /**
     * @license
     * 
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /**
     * @fileoverview Define generation methods for custom blocks.
     * @author samelh@google.com (Sam El-Husseini)
     */

    const CONDITIONS_TO_KAREL_JS = {
        FRONT_CLEAR: 'karel.frontIsClear()',
        FRONT_BLOCKED: '!karel.frontIsClear()',
        STONES_PRESENT: 'karel.stonesPresent()',
        STONES_NOT_PRESENT: '!karel.stonesPresent()'
    }

    // More on generating code:
    // https://developers.google.com/blockly/guides/create-custom-blocks/generating-code
    Blockly.JavaScript['karel_main'] = function (block) {
        var statements_program = Blockly.JavaScript.statementToCode(block, 'program');
        return statements_program
    };

    Blockly.JavaScript['karel_world_main'] = function (block) {
        var statements_program = Blockly.JavaScript.statementToCode(block, 'program');
        return statements_program
    };

    Blockly.JavaScript['karel_world_end_conditions'] = function (block) {
        var statements_program = Blockly.JavaScript.statementToCode(block, 'end_conditions');
        return statements_program
    };

    Blockly.JavaScript['karel_world_fail'] = function () {
        return 'karel.error = "You failed, try again!"'
    };

    Blockly.JavaScript['karel_world_success'] = function () {
        return 'return true'
    };

    Blockly.JavaScript['karel_stone_count'] = function (block) {
        var color = block.getFieldValue('COLOR');
        return ['karel.world.pickedStones.' + color, Blockly.JavaScript.ORDER_NONE];
    };

    Blockly.JavaScript['karel_world_stone_count'] = function (block) {
        var color = block.getFieldValue('COLOR');
        return ['karel.world.stones.filter(stone => stone.color === "' + color + '").reduce((acc, stone) => acc + stone.n, 0)', Blockly.JavaScript.ORDER_NONE];
    };

    Blockly.JavaScript['karel_world_spawn_stone'] = function (block) {
        var color = block.getFieldValue('COLOR');
        var row = Blockly.JavaScript.valueToCode(block, 'ROW', Blockly.JavaScript.ORDER_NONE) || '0';
        var col = Blockly.JavaScript.valueToCode(block, 'COL', Blockly.JavaScript.ORDER_NONE) || '0';
        return 'karel.spawnStone("' + color + '", ' + row + ', ' + col + ');\n';
    };

    Blockly.JavaScript['karel_agent_collision'] = function(block) {
      return ['karel.checkCollision()', Blockly.JavaScript.ORDER_NONE]
    }

    Blockly.JavaScript['karel_move'] = function () {
        return 'karel.move();\n'
    };

    Blockly.JavaScript['karel_bounce'] = function() {
      return 'karel.bounce();\n'
    }

    //  Monkeypatch callnoreturn so we can make the await
    // TODO Fix Bug when Learner Defins Fn Name that Starts with a Number
    Blockly.JavaScript['procedures_callreturn'] = function (block) {
        let funcName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
        let args = [];
        let variables = block.getVars();
        for (let i = 0; i < variables.length; i++) {
            args[i] = Blockly.JavaScript.valueToCode(block, 'ARG' + i, Blockly.JavaScript.ORDER_NONE) || 'null';
        }
        var code = `await ${funcName}(${args.join(',')})`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
    Blockly.JavaScript['procedures_callnoreturn'] = function (block) {
        return Blockly.JavaScript['procedures_callreturn'](block)[0] + ';\n';
    };

    Blockly.JavaScript['procedures_defreturn'] = function (block) {
        var functionName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);

        var codeStatements = Blockly.JavaScript.statementToCode(block, 'STACK');

        for (var args = [], variables = block.getVars(), i = 0; i < variables.length; i++)
            args[i] = Blockly.JavaScript.variableDB_.getName(variables[i], Blockly.VARIABLE_CATEGORY_NAME);
        var argsAssignment = args.map(arg => 'karel.variables["' + arg + '"] = {value:' + arg + ', func:"' + functionName + '"};').join('\n');

        var code = 'function ' + functionName + '(' + args.join(', ') + ') {\n' + argsAssignment + codeStatements + '}';
        Blockly.JavaScript.definitions_['%' + functionName] = code;

        return null;
    };
    Blockly.JavaScript['procedures_defreturn'] = function (block) {
        var functionName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);

        var codeStatements = Blockly.JavaScript.statementToCode(block, 'STACK');

        var returnStatement = Blockly.JavaScript.valueToCode(block, 'RETURN', Blockly.JavaScript.ORDER_NONE) || '';
        returnStatement && (returnStatement = Blockly.JavaScript.INDENT + "return " + returnStatement + ';\n');

        for (var args = [], variables = block.getVars(), i = 0; i < variables.length; i++)
            args[i] = Blockly.JavaScript.variableDB_.getName(variables[i], Blockly.VARIABLE_CATEGORY_NAME);
        var argsAssignment = args.map(arg => 'karel.variables["' + arg + '"] = {value:' + arg + ', func:"' + functionName + '"};').join('\n');

        var code = 'function ' + functionName + '(' + args.join(', ') + ') {\n' + argsAssignment + codeStatements + returnStatement + '}';
        Blockly.JavaScript.definitions_['%' + functionName] = code;

        return null;
    };
    
    Blockly.JavaScript['variables_set'] = function (block) {
        var value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
        var varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
        var code = 'if (karel.variables["' + varName + '"]) karel.variables["' + varName + '"].value = ' + value + '; else karel.variables["' + varName + '"] = {value:' + value + ', func:""};\n';
        return code;
    };
    Blockly.JavaScript['variables_get'] = function (block) {
        var varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
        var code = '(karel.variables["' + varName + '"] ? karel.variables["' + varName + '"].value : ((karel.error = "\\"' + varName + '\\" has not been initialized!") && 0))';
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };

    Blockly.JavaScript['karel_turn_left'] = function () {
        return 'karel.turnLeft();\n'
    };

    Blockly.JavaScript['karel_place_stone'] = function (block) {
        var color = block.getFieldValue('COLOR');
        return 'karel.placeStone("' + color + '");\n'
    };

    Blockly.JavaScript['karel_pickup_stone'] = function (block) {
        var color = block.getFieldValue('COLOR');
        return 'karel.pickStone("' + color + '");\n'
    };

    Blockly.JavaScript['karel_stone_present'] = function(block) {
      var color = block.getFieldValue('COLOR');
      return ['karel.stonesPresent("' + color + '")', Blockly.JavaScript.ORDER_NONE];
    }

    Blockly.JavaScript['karel_no_obstacle'] = function(block) {
      return ['karel.noObstacle()', Blockly.JavaScript.ORDER_NONE];
    }

    Blockly.JavaScript['karel_if_dropdown'] = function (block) {
        var dropdown_condition = CONDITIONS_TO_KAREL_JS[block.getFieldValue('CONDITION')];
        var statements_then = Blockly.JavaScript.statementToCode(block, 'THEN');
        var code = 'if (' + dropdown_condition + ') { await step();\n';
        code += statements_then
        code += '}\n'
        return code;
    };

    Blockly.JavaScript['karel_ifelse'] = function (block) {
        var if_condition = CONDITIONS_TO_KAREL_JS[block.getFieldValue('IF0')];
        var if_statement = Blockly.JavaScript.statementToCode(block, 'THEN0');
        var code = 'if (' + if_condition + ') { await step();\n';
        code += if_statement
        code += '}\n'
        
        var i = 1;
        while(block.getInput('IF' + i)) {
            var elseif_condition = CONDITIONS_TO_KAREL_JS[block.getFieldValue('IF' + i)]
            var elseif_statement = Blockly.JavaScript.statementToCode(block, 'THEN' + i);
            code += 'else if (' + elseif_condition + ') { await step();\n';
            code += elseif_statement
            code += '}\n'
        }

        if (block.getInput('ELSE')) {
            var else_statement = Blockly.JavaScript.statementToCode(block, 'ELSE');
            code += 'else { await step()\n';
            code += else_statement
            code += '}\n'
        }

        return code;
    };

    Blockly.JavaScript['karel_is_key_pressed'] = function (block) {
        var key = block.getFieldValue('KEY');
        var code = 'karel.isKeyPressed("' + key + '")';
        return [code, Blockly.JavaScript.ORDER_NONE];
    };

    Blockly.JavaScript['karel_on_key_press'] = function (block) {
        var statements = Blockly.JavaScript.statementToCode(block, 'DO');
        var code = statements;
        return code;
    };

    Blockly.JavaScript['math_random_int'] = function(block) {
        var a = Blockly.JavaScript.valueToCode(block, 'FROM', Blockly.JavaScript.ORDER_NONE) || '0';
        var b = Blockly.JavaScript.valueToCode(block, 'TO', Blockly.JavaScript.ORDER_NONE) || '0';
        return [`Math.floor(Math.random() * (${b} - ${a} + 1) + ${a})`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    }

    var wait_counter = 0;
    Blockly.JavaScript['karel_wait'] = function (block) {
        var time = Blockly.JavaScript.valueToCode(block, 'TIME', Blockly.JavaScript.ORDER_NONE) || '0';
        var code = 'for (let wait_counter_' + wait_counter + ' = 0; wait_counter_' + wait_counter + ' < ' + time + '; ++wait_counter_' + wait_counter + ') { await step(); }\n';
        ++wait_counter;
        return code
    }

    var while_count = 0;
    Blockly.JavaScript['karel_while_dropdown'] = function (block) {
        var dropdown_condition = CONDITIONS_TO_KAREL_JS[block.getFieldValue('CONDITION')];
        var statements_loop = Blockly.JavaScript.statementToCode(block, 'LOOP');
        var code = 'var while_counter_' + while_count + ' = 100;\n';
        code += 'while (' + dropdown_condition + ') { await step();\n'
        code += 'if (--while_counter_' + while_count + ' === 0) karel.error = "Infinite loop!";\n'
        code += statements_loop + '\n'
        code += '}\n'
        ++while_count;
        return code;
    };
    Blockly.JavaScript['controls_whileUntil'] = function(block)  {
        var mode = block.getFieldValue('MODE');
        var condition = Blockly.JavaScript.valueToCode(
            block,
            'BOOL',
            mode === 'UNTIL' ? Blockly.JavaScript.ORDER_LOGICAL_NOT : Blockly.JavaScript.ORDER_NONE
        );
        var statements = Blockly.JavaScript.statementToCode(block, 'DO');
        var code = 'var while_counter_' + while_count + ' = 100;\n';
        code += 'while (' + condition + ') { await step();\n'
        code += 'if (--while_counter_' + while_count + ' === 0) karel.error = "Infinite loop!";\n'
        code += statements + '\n'
        code += '}\n'
        ++while_count;
        return code;
    };
}