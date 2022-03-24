export default {
    "name": "Stones in Corners",
    "hint": "To rebuild the column, use a while loop to move upwards and a conditional inside the while loop to decide whether to place a stone.",
    "preWorld": { "nCols": 7, "nRows": 5, "karelRow": 4, "karelCol": 0, "karelDir": "East", "walls": [], "stones": [{ "r": 4, "c": 1, "n": 1 }, { "r": 4, "c": 3, "n": 1 }, { "r": 3, "c": 3, "n": 1 }, { "r": 4, "c": 4, "n": 1 }, { "r": 4, "c": 6, "n": 1 }], "lastClicked": null, "editWallR": null, "editWallC": null, "editWallD": null, "editRow": null, "editCol": null },
    "postWorld": { "nCols": 7, "nRows": 5, "karelRow": 4, "karelCol": 6, "karelDir": "East", "walls": [], "stones": [{ "r": 4, "c": 1, "n": 1 }, { "r": 3, "c": 1, "n": 1 }, { "r": 2, "c": 1, "n": 1 }, { "r": 1, "c": 1, "n": 1 }, { "r": 0, "c": 1, "n": 1 }, { "r": 4, "c": 3, "n": 1 }, { "r": 3, "c": 3, "n": 1 }, { "r": 2, "c": 3, "n": 1 }, { "r": 1, "c": 3, "n": 1 }, { "r": 0, "c": 3, "n": 1 }, { "r": 4, "c": 4, "n": 1 }, { "r": 3, "c": 4, "n": 1 }, { "r": 2, "c": 4, "n": 1 }, { "r": 1, "c": 4, "n": 1 }, { "r": 0, "c": 4, "n": 1 }, { "r": 4, "c": 6, "n": 1 }, { "r": 3, "c": 6, "n": 1 }, { "r": 2, "c": 6, "n": 1 }, { "r": 1, "c": 6, "n": 1 }, { "r": 0, "c": 6, "n": 1 }], "lastClicked": null, "editWallR": null, "editWallC": null, "editWallD": null, "editRow": null, "editCol": null },
    "instructions": "Use all of the code blocks in the workspace to complete the two functions, and help Karel achieve the goal.",
    "hideToolbox": false,
    "maxBlocks": null,
    "karelBlockly": {
        "toolbox": "\n  <xml>\n    <Block type=\"procedures_callnoreturn\"><mutation name=\"build column\" /></Block><Block type=\"procedures_callnoreturn\"><mutation name=\"return to base\" /></Block>\n    <Block type=\"karel_move\" id=\"karel_move\" />\n    <Block type=\"karel_turn_left\" id=\"karel_turn\" />\n    <Block type=\"karel_place_stone\" id=\"karel_place\" />\n    <Block type=\"karel_pickup_stone\" id=\"karel_pickup\" />\n    <Block type=\"karel_if_dropdown\" id=\"karel_if\" />\n    \n    <Block type=\"karel_while_dropdown\" id=\"karel_while\" />\n    <Block type=\"procedures_defnoreturn\" id=\"karel_define\" />\n  </xml>\n",
        "settings": { "blocks": { "karel_move": { "active": true, "limit": -1 }, "karel_turn": { "active": true, "limit": -1 }, "karel_place": { "active": true, "limit": -1 }, "karel_pickup": { "active": true, "limit": -1 }, "karel_if": { "active": true, "limit": -1 }, "karel_repeat": { "active": false, "limit": -1 }, "karel_while": { "active": true, "limit": -1 }, "karel_define": { "active": true, "limit": -1 } }, "showToolbox": false, "disabled": false, "maxBlocks": -1, "customizerMode": false },
        "workspace": "<xml xmlns=\"https://developers.google.com/blockly/xml\"><block type=\"karel_main\" id=\"main\" deletable=\"false\" movable=\"false\" editable=\"false\" x=\"16\" y=\"16\"><statement name=\"program\"><block type=\"karel_while_dropdown\" id=\"ktD#LExN#8uy{tuj6I0D\" deletable=\"false\" movable=\"false\" editable=\"false\"><field name=\"CONDITION\">FRONT_CLEAR</field><statement name=\"LOOP\"><block type=\"karel_move\" id=\"3EeNN{fqghpdDX{y)PAO\" deletable=\"false\" movable=\"false\" editable=\"false\"><next><block type=\"karel_if_dropdown\" id=\"?%abueatYT.nDu}zM@U|\" deletable=\"false\" movable=\"false\" editable=\"false\"><field name=\"CONDITION\">STONES_PRESENT</field><statement name=\"THEN\"><block type=\"procedures_callnoreturn\" id=\"w;G%t[)8U;Up@.FNc!sv\" deletable=\"false\" movable=\"false\" editable=\"false\"><mutation name=\"build column\"></mutation><next><block type=\"procedures_callnoreturn\" id=\"$Ap;Tb]1TB{AYZ0sg]aX\" deletable=\"false\" movable=\"false\" editable=\"false\"><mutation name=\"return to base\"></mutation></block></next></block></statement></block></next></block></statement></block></statement></block><block type=\"procedures_defnoreturn\" id=\"Wx08ytl3s9|l.Hrb5F)3\" deletable=\"false\" x=\"235\" y=\"18\"><field name=\"NAME\">build column</field></block><block type=\"karel_turn_left\" id=\".i]4)-;iu4FeUxH2C.oS\" deletable=\"false\" x=\"459\" y=\"24\"></block><block type=\"karel_turn_left\" id=\"?|]:OU6`M%x*oPIr*DHf\" deletable=\"false\" x=\"245\" y=\"103\"></block><block type=\"karel_turn_left\" id=\"2,51g+SO:br6|(=GA~*/\" deletable=\"false\" x=\"356\" y=\"105\"></block><block type=\"karel_place_stone\" id=\":=Io:/uBMCW;(BVg@Rt^\" deletable=\"false\" x=\"458\" y=\"107\"></block><block type=\"karel_turn_left\" id=\"g?uC+evimd77(M%0K[$E\" deletable=\"false\" x=\"249\" y=\"161\"></block><block type=\"karel_place_stone\" id=\"3bVXvdZvP5j%ROe}(wZg\" deletable=\"false\" x=\"350\" y=\"164\"></block><block type=\"karel_while_dropdown\" id=\"nnTPj+K2V!rGsjnm@Eyn\" deletable=\"false\" x=\"228\" y=\"245\"><field name=\"CONDITION\">FRONT_CLEAR</field></block><block type=\"karel_move\" id=\"gh?{?_bzeS;0%pf+)MS3\" deletable=\"false\" x=\"424\" y=\"235\"></block><block type=\"procedures_defnoreturn\" id=\"4u?bvx}c3^cJMnENL?=3\" deletable=\"false\" x=\"22\" y=\"264\"><field name=\"NAME\">return to base</field></block><block type=\"karel_move\" id=\"|Yq:{$4zrU^HAxj]1z5y\" deletable=\"false\" x=\"430\" y=\"301\"></block><block type=\"karel_if_dropdown\" id=\")-/h8Oz~m|Z|e8ovP[vK\" deletable=\"false\" x=\"27\" y=\"350\"><field name=\"CONDITION\">STONES_NOT_PRESENT</field></block><block type=\"karel_while_dropdown\" id=\"%hntys;-tweX$0GO}P~E\" deletable=\"false\" x=\"232\" y=\"343\"><field name=\"CONDITION\">FRONT_CLEAR</field></block></xml>",
        "highlight": []
    }
}