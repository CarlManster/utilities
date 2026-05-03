#!/bin/bash
# Usage: ./build_lang.sh
# Reads *_en.json, *_ko.json, *_jp.json and generates *_lang.js for each page.

cd "$(dirname "$0")"

node -e "
var fs = require('fs');
var path = require('path');

var pages = [
  { dir: '.', name: 'index' },
  { dir: 'Dices', name: 'DiceCalculator' },
  { dir: 'ColorPicker', name: 'ColorPicker' },
  { dir: 'JSONVisualizer', name: 'JSONVisualizer' },
  { dir: 'DayInfo', name: 'DayInfo' },
  { dir: 'Repayment', name: 'Repayment' },
  { dir: 'QRGenerator', name: 'QRGenerator' },
  { dir: 'ExchangeRate', name: 'ExchangeRate' }
];

var langs = ['en', 'ko', 'jp'];

pages.forEach(function(page) {
  var data = {};
  langs.forEach(function(lang) {
    var file = path.join(page.dir, page.name + '_' + lang + '.json');
    if (fs.existsSync(file)) {
      data[lang] = JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  });
  var out = path.join(page.dir, page.name + '_lang.js');
  fs.writeFileSync(out, 'I18N.register(' + JSON.stringify(data, null, 2) + ');\n');
  console.log('Generated: ' + out);
});
"
