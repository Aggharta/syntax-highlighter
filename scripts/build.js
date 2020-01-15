#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Languages
let langs = [];
fs.readdirSync(__dirname + "/../grammars/").forEach(name => {
    langs.push(path.basename(name, ".json"));
});

// Language-package map
const langMap = {
    typescript: ["typescript", "typescript"],
    typescriptreact: ["typescript", "tsx"],
    shellscript: ["bash"]
}

// Build wasm parsers for supported languages
const parsersDir = __dirname + "/../parsers";
if (!fs.existsSync(parsersDir)) {
    fs.mkdirSync(parsersDir);
}
for (li of langs) {
    const lang = li;
    let module = "node_modules/tree-sitter-" + lang;
    let output = "tree-sitter-" + lang + ".wasm";
    if (langMap[lang]) {
        module = path.join("node_modules/tree-sitter-" +
            langMap[lang][0], ...langMap[lang].slice(1))
        output = "tree-sitter-" + langMap[lang][langMap[lang].length - 1] + ".wasm";
    }

    console.log("Compiling " + lang + " parser");
    var isWin = process.platform === "win32";
    
    if (isWin) {
        var command = 'emcc -o ' + output + ' -Os -s WASM=1 -s SIDE_MODULE=1, -s TOTAL_MEMORY=33554432 -s NODEJS_CATCH_EXIT=0 -s EXPORTED_FUNCTIONS=["tree-sitter-' + lang + '"] -fno-exceptions -I ' + module + '\\src ' + module + '.\\src\\parser.c'
    }
    else{
        var command = "node_modules/.bin/tree-sitter build-wasm " + module
    }
    exec(command,
        (err) => {
            if (err)
                console.log("Failed to build wasm for " + lang + ": " + err.message);
            else
                fs.rename(output, "parsers/" + lang + ".wasm",
                    (err) => {
                        if (err)
                            console.log("Failed to copy built parser: " + err.message);
                        else
                            console.log("Successfully compiled " + lang + " parser");
                    });
        });
}
