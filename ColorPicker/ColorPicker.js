// ─── CSS 140 named colors + extended color names with Korean translations ───
const NAMED_COLORS = [
  // CSS 표준 140색
  {r:240,g:248,b:255,en:"AliceBlue",ko:"앨리스블루"},
  {r:250,g:235,b:215,en:"AntiqueWhite",ko:"앤틱화이트"},
  {r:0,g:255,b:255,en:"Aqua",ko:"아쿠아"},
  {r:127,g:255,b:212,en:"Aquamarine",ko:"아쿠아마린"},
  {r:240,g:255,b:255,en:"Azure",ko:"하늘색"},
  {r:245,g:245,b:220,en:"Beige",ko:"베이지"},
  {r:255,g:228,b:196,en:"Bisque",ko:"비스크"},
  {r:0,g:0,b:0,en:"Black",ko:"검정"},
  {r:255,g:235,b:205,en:"BlanchedAlmond",ko:"블랜치드아몬드"},
  {r:0,g:0,b:255,en:"Blue",ko:"파랑"},
  {r:138,g:43,b:226,en:"BlueViolet",ko:"청보라"},
  {r:165,g:42,b:42,en:"Brown",ko:"갈색"},
  {r:222,g:184,b:135,en:"BurlyWood",ko:"벌리우드"},
  {r:95,g:158,b:160,en:"CadetBlue",ko:"카뎃블루"},
  {r:127,g:255,b:0,en:"Chartreuse",ko:"샤르트뢰즈"},
  {r:210,g:105,b:30,en:"Chocolate",ko:"초콜릿"},
  {r:255,g:127,b:80,en:"Coral",ko:"산호색"},
  {r:100,g:149,b:237,en:"CornflowerBlue",ko:"수레국화파랑"},
  {r:255,g:248,b:220,en:"Cornsilk",ko:"콘실크"},
  {r:220,g:20,b:60,en:"Crimson",ko:"크림슨"},
  {r:0,g:255,b:255,en:"Cyan",ko:"시안"},
  {r:0,g:0,b:139,en:"DarkBlue",ko:"어두운파랑"},
  {r:0,g:139,b:139,en:"DarkCyan",ko:"어두운시안"},
  {r:184,g:134,b:11,en:"DarkGoldenrod",ko:"어두운골든로드"},
  {r:169,g:169,b:169,en:"DarkGray",ko:"어두운회색"},
  {r:0,g:100,b:0,en:"DarkGreen",ko:"어두운초록"},
  {r:189,g:183,b:107,en:"DarkKhaki",ko:"어두운카키"},
  {r:139,g:0,b:139,en:"DarkMagenta",ko:"어두운마젠타"},
  {r:85,g:107,b:47,en:"DarkOliveGreen",ko:"어두운올리브초록"},
  {r:255,g:140,b:0,en:"DarkOrange",ko:"어두운주황"},
  {r:153,g:50,b:204,en:"DarkOrchid",ko:"어두운난초색"},
  {r:139,g:0,b:0,en:"DarkRed",ko:"어두운빨강"},
  {r:233,g:150,b:122,en:"DarkSalmon",ko:"어두운연어색"},
  {r:143,g:188,b:143,en:"DarkSeaGreen",ko:"어두운바다초록"},
  {r:72,g:61,b:139,en:"DarkSlateBlue",ko:"어두운슬레이트블루"},
  {r:47,g:79,b:79,en:"DarkSlateGray",ko:"어두운슬레이트그레이"},
  {r:0,g:206,b:209,en:"DarkTurquoise",ko:"어두운터콰이즈"},
  {r:148,g:0,b:211,en:"DarkViolet",ko:"어두운보라"},
  {r:255,g:20,b:147,en:"DeepPink",ko:"딥핑크"},
  {r:0,g:191,b:255,en:"DeepSkyBlue",ko:"딥스카이블루"},
  {r:105,g:105,b:105,en:"DimGray",ko:"흐린회색"},
  {r:30,g:144,b:255,en:"DodgerBlue",ko:"다저블루"},
  {r:178,g:34,b:34,en:"Firebrick",ko:"내화벽돌색"},
  {r:255,g:250,b:240,en:"FloralWhite",ko:"꽃무늬흰색"},
  {r:34,g:139,b:34,en:"ForestGreen",ko:"숲초록"},
  {r:255,g:0,b:255,en:"Fuchsia",ko:"자홍색"},
  {r:220,g:220,b:220,en:"Gainsboro",ko:"게인즈버러"},
  {r:248,g:248,b:255,en:"GhostWhite",ko:"고스트화이트"},
  {r:255,g:215,b:0,en:"Gold",ko:"금색"},
  {r:218,g:165,b:32,en:"Goldenrod",ko:"골든로드"},
  {r:128,g:128,b:128,en:"Gray",ko:"회색"},
  {r:0,g:128,b:0,en:"Green",ko:"초록"},
  {r:173,g:255,b:47,en:"GreenYellow",ko:"초록노랑"},
  {r:240,g:255,b:240,en:"Honeydew",ko:"허니듀"},
  {r:255,g:105,b:180,en:"HotPink",ko:"핫핑크"},
  {r:205,g:92,b:92,en:"IndianRed",ko:"인디언레드"},
  {r:75,g:0,b:130,en:"Indigo",ko:"남색"},
  {r:255,g:255,b:240,en:"Ivory",ko:"아이보리"},
  {r:240,g:230,b:140,en:"Khaki",ko:"카키"},
  {r:230,g:230,b:250,en:"Lavender",ko:"라벤더"},
  {r:255,g:240,b:245,en:"LavenderBlush",ko:"라벤더블러쉬"},
  {r:124,g:252,b:0,en:"LawnGreen",ko:"잔디초록"},
  {r:255,g:250,b:205,en:"LemonChiffon",ko:"레몬쉬폰"},
  {r:173,g:216,b:230,en:"LightBlue",ko:"연한파랑"},
  {r:240,g:128,b:128,en:"LightCoral",ko:"연한산호색"},
  {r:224,g:255,b:255,en:"LightCyan",ko:"연한시안"},
  {r:250,g:250,b:210,en:"LightGoldenrodYellow",ko:"연한골든로드노랑"},
  {r:211,g:211,b:211,en:"LightGray",ko:"연한회색"},
  {r:144,g:238,b:144,en:"LightGreen",ko:"연한초록"},
  {r:255,g:182,b:193,en:"LightPink",ko:"연한분홍"},
  {r:255,g:160,b:122,en:"LightSalmon",ko:"연한연어색"},
  {r:32,g:178,b:170,en:"LightSeaGreen",ko:"연한바다초록"},
  {r:135,g:206,b:250,en:"LightSkyBlue",ko:"연한하늘파랑"},
  {r:119,g:136,b:153,en:"LightSlateGray",ko:"연한슬레이트그레이"},
  {r:176,g:196,b:222,en:"LightSteelBlue",ko:"연한강철파랑"},
  {r:255,g:255,b:224,en:"LightYellow",ko:"연한노랑"},
  {r:0,g:255,b:0,en:"Lime",ko:"라임"},
  {r:50,g:205,b:50,en:"LimeGreen",ko:"라임초록"},
  {r:250,g:240,b:230,en:"Linen",ko:"리넨"},
  {r:255,g:0,b:255,en:"Magenta",ko:"마젠타"},
  {r:128,g:0,b:0,en:"Maroon",ko:"적갈색"},
  {r:102,g:205,b:170,en:"MediumAquamarine",ko:"미디엄아쿠아마린"},
  {r:0,g:0,b:205,en:"MediumBlue",ko:"미디엄블루"},
  {r:186,g:85,b:211,en:"MediumOrchid",ko:"미디엄난초색"},
  {r:147,g:112,b:219,en:"MediumPurple",ko:"미디엄보라"},
  {r:60,g:179,b:113,en:"MediumSeaGreen",ko:"미디엄바다초록"},
  {r:123,g:104,b:238,en:"MediumSlateBlue",ko:"미디엄슬레이트블루"},
  {r:0,g:250,b:154,en:"MediumSpringGreen",ko:"미디엄봄초록"},
  {r:72,g:209,b:204,en:"MediumTurquoise",ko:"미디엄터콰이즈"},
  {r:199,g:21,b:133,en:"MediumVioletRed",ko:"미디엄바이올렛레드"},
  {r:25,g:25,b:112,en:"MidnightBlue",ko:"미드나잇블루"},
  {r:245,g:255,b:250,en:"MintCream",ko:"민트크림"},
  {r:255,g:228,b:225,en:"MistyRose",ko:"미스티로즈"},
  {r:255,g:228,b:181,en:"Moccasin",ko:"모카신"},
  {r:255,g:222,b:173,en:"NavajoWhite",ko:"나바호화이트"},
  {r:0,g:0,b:128,en:"Navy",ko:"남청색"},
  {r:253,g:245,b:230,en:"OldLace",ko:"올드레이스"},
  {r:128,g:128,b:0,en:"Olive",ko:"올리브"},
  {r:107,g:142,b:35,en:"OliveDrab",ko:"올리브드랩"},
  {r:255,g:165,b:0,en:"Orange",ko:"주황"},
  {r:255,g:69,b:0,en:"OrangeRed",ko:"주황빨강"},
  {r:218,g:112,b:214,en:"Orchid",ko:"난초색"},
  {r:238,g:232,b:170,en:"PaleGoldenrod",ko:"연한골든로드"},
  {r:152,g:251,b:152,en:"PaleGreen",ko:"연한초록"},
  {r:175,g:238,b:238,en:"PaleTurquoise",ko:"연한터콰이즈"},
  {r:219,g:112,b:147,en:"PaleVioletRed",ko:"연한바이올렛레드"},
  {r:255,g:239,b:213,en:"PapayaWhip",ko:"파파야윕"},
  {r:255,g:218,b:185,en:"PeachPuff",ko:"복숭아색"},
  {r:205,g:133,b:63,en:"Peru",ko:"페루"},
  {r:255,g:192,b:203,en:"Pink",ko:"분홍"},
  {r:221,g:160,b:221,en:"Plum",ko:"자두색"},
  {r:176,g:224,b:230,en:"PowderBlue",ko:"파우더블루"},
  {r:128,g:0,b:128,en:"Purple",ko:"보라"},
  {r:102,g:51,b:153,en:"RebeccaPurple",ko:"레베카퍼플"},
  {r:255,g:0,b:0,en:"Red",ko:"빨강"},
  {r:188,g:143,b:143,en:"RosyBrown",ko:"장미갈색"},
  {r:65,g:105,b:225,en:"RoyalBlue",ko:"로열블루"},
  {r:139,g:69,b:19,en:"SaddleBrown",ko:"안장갈색"},
  {r:250,g:128,b:114,en:"Salmon",ko:"연어색"},
  {r:244,g:164,b:96,en:"SandyBrown",ko:"모래갈색"},
  {r:46,g:139,b:87,en:"SeaGreen",ko:"바다초록"},
  {r:255,g:245,b:238,en:"SeaShell",ko:"조개껍데기색"},
  {r:160,g:82,b:45,en:"Sienna",ko:"시에나"},
  {r:192,g:192,b:192,en:"Silver",ko:"은색"},
  {r:135,g:206,b:235,en:"SkyBlue",ko:"하늘파랑"},
  {r:106,g:90,b:205,en:"SlateBlue",ko:"슬레이트블루"},
  {r:112,g:128,b:144,en:"SlateGray",ko:"슬레이트그레이"},
  {r:255,g:250,b:250,en:"Snow",ko:"눈색"},
  {r:0,g:255,b:127,en:"SpringGreen",ko:"봄초록"},
  {r:70,g:130,b:180,en:"SteelBlue",ko:"강철파랑"},
  {r:210,g:180,b:140,en:"Tan",ko:"황갈색"},
  {r:0,g:128,b:128,en:"Teal",ko:"틸"},
  {r:216,g:191,b:216,en:"Thistle",ko:"엉겅퀴색"},
  {r:255,g:99,b:71,en:"Tomato",ko:"토마토색"},
  {r:64,g:224,b:208,en:"Turquoise",ko:"터콰이즈"},
  {r:238,g:130,b:238,en:"Violet",ko:"바이올렛"},
  {r:245,g:222,b:179,en:"Wheat",ko:"밀색"},
  {r:255,g:255,b:255,en:"White",ko:"흰색"},
  {r:245,g:245,b:245,en:"WhiteSmoke",ko:"연기흰색"},
  {r:255,g:255,b:0,en:"Yellow",ko:"노랑"},
  {r:154,g:205,b:50,en:"YellowGreen",ko:"노랑초록"},

  // ─── 추가 확장 색상 (일본 전통색, 한국 전통색, 웹/디자인 색) ───
  {r:228,g:0,b:43,en:"Vermilion",ko:"주홍색"},
  {r:0,g:71,b:171,en:"Cobalt Blue",ko:"코발트블루"},
  {r:0,g:168,b:107,en:"Jade",ko:"비취색"},
  {r:0,g:103,b:165,en:"Sapphire",ko:"사파이어"},
  {r:224,g:176,b:255,en:"Mauve",ko:"모브"},
  {r:80,g:200,b:120,en:"Emerald",ko:"에메랄드"},
  {r:181,g:126,b:220,en:"Amethyst",ko:"자수정"},
  {r:204,g:85,b:0,en:"Burnt Orange",ko:"버번트오렌지"},
  {r:112,g:128,b:144,en:"Slate",ko:"슬레이트"},
  {r:255,g:191,b:0,en:"Amber",ko:"호박색"},
  {r:0,g:158,b:96,en:"Shamrock",ko:"샴록"},
  {r:193,g:154,b:107,en:"Desert Sand",ko:"사막모래색"},
  {r:103,g:76,b:71,en:"Umber",ko:"엄버"},
  {r:196,g:30,b:58,en:"Cardinal",ko:"카디널"},
  {r:0,g:47,b:167,en:"Ultramarine",ko:"군청색"},
  {r:255,g:170,b:204,en:"Carnation Pink",ko:"카네이션핑크"},
  {r:8,g:37,b:103,en:"Navy Blue",ko:"네이비블루"},
  {r:255,g:203,b:164,en:"Peach",ko:"복숭아"},
  {r:204,g:204,b:0,en:"Acid Green",ko:"애시드그린"},
  {r:189,g:51,b:164,en:"Byzantine",ko:"비잔틴"},
  {r:0,g:191,b:255,en:"Capri",ko:"카프리"},
  {r:222,g:49,b:99,en:"Cerise",ko:"체리색"},
  {r:127,g:255,b:0,en:"Chartreuse Green",ko:"연두색"},
  {r:255,g:167,b:0,en:"Marigold",ko:"금잔화색"},
  {r:255,g:216,b:0,en:"Dandelion",ko:"민들레색"},
  {r:80,g:0,b:0,en:"Dark Maroon",ko:"짙은적갈색"},
  {r:232,g:222,b:176,en:"Flax",ko:"아마색"},
  {r:79,g:121,b:66,en:"Fern Green",ko:"양치식물초록"},
  {r:153,g:0,b:0,en:"Dark Candy Apple Red",ko:"짙은사과빨강"},
  {r:254,g:111,b:94,en:"Bittersweet",ko:"비터스위트"},
  {r:126,g:249,b:255,en:"Electric Blue",ko:"일렉트릭블루"},
  {r:80,g:220,b:100,en:"Malachite",ko:"공작석색"},
  {r:194,g:178,b:128,en:"Sand",ko:"모래색"},
  {r:144,g:12,b:63,en:"Claret",ko:"클라렛"},
  {r:36,g:122,b:154,en:"Cerulean",ko:"하늘청색"},
  {r:237,g:201,b:175,en:"Apricot",ko:"살구색"},
  {r:250,g:218,b:94,en:"Royal Gold",ko:"로열골드"},
  {r:255,g:36,b:0,en:"Scarlet",ko:"스칼렛"},
  {r:1,g:121,b:111,en:"Teal Green",ko:"틸그린"},
  {r:120,g:81,b:169,en:"Royal Purple",ko:"로열퍼플"},
  {r:255,g:239,b:213,en:"Champagne",ko:"샴페인"},
  {r:255,g:253,b:208,en:"Cream",ko:"크림색"},
  {r:177,g:156,b:217,en:"Wisteria",ko:"등나무색"},
  {r:188,g:212,b:230,en:"Powder",ko:"파우더"},
  {r:108,g:160,b:220,en:"Cornflower",ko:"수레국화색"},
  {r:47,g:79,b:79,en:"Dark Teal",ko:"짙은틸"},
  {r:255,g:83,b:73,en:"Sunset Orange",ko:"석양주황"},
  {r:148,g:103,b:189,en:"Medium Purple",ko:"중간보라"},

  // 한국 전통색 (오방색 및 전통 색상)
  {r:200,g:16,b:46,en:"Korean Red (Jeokssaek)",ko:"적색"},
  {r:0,g:82,b:165,en:"Korean Blue (Cheongsaek)",ko:"청색"},
  {r:255,g:181,b:0,en:"Korean Yellow (Hwangsaek)",ko:"황색"},
  {r:28,g:110,b:51,en:"Korean Green (Noksaek)",ko:"녹색"},
  {r:192,g:0,b:123,en:"Korean Magenta (Jajusaek)",ko:"자주색"},
  {r:232,g:103,b:62,en:"Korean Persimmon (Gamsaek)",ko:"감색"},
  {r:112,g:48,b:48,en:"Korean Chestnut (Bamsaek)",ko:"밤색"},
  {r:180,g:149,b:100,en:"Korean Camel (Naktasaek)",ko:"낙타색"},
  {r:156,g:186,b:95,en:"Korean Willow (Yeondu)",ko:"연두"},
  {r:108,g:174,b:117,en:"Korean Celadon (Cheongja)",ko:"청자색"},
  {r:255,g:112,b:150,en:"Korean Peach (Boksung-a)",ko:"복숭아꽃색"},
  {r:86,g:47,b:14,en:"Korean Dark Brown (Heuksaek-gal)",ko:"흑갈색"},
  {r:61,g:43,b:31,en:"Korean Coffee (Keopi)",ko:"커피색"},
  {r:204,g:164,b:59,en:"Korean Brass (Notssaek)",ko:"놋색"},
  {r:200,g:190,b:183,en:"Korean Ash (Jaesaek)",ko:"잿빛"},
];

// ─── Utility functions ───

function rgbToCmy(r, g, b) {
  return { c: 255 - r, m: 255 - g, y: 255 - b };
}

function rgbToHsb(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s: Math.round(s * 100), b: Math.round(max * 100) };
}

function toHex2(n) {
  return n.toString(16).toUpperCase().padStart(2, '0');
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  // Weighted Euclidean distance (approximate perceptual)
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
}

function findNearestColors(r, g, b, count) {
  const distances = NAMED_COLORS.map(c => ({
    ...c,
    dist: colorDistance(r, g, b, c.r, c.g, c.b)
  }));
  distances.sort((a, b) => a.dist - b.dist);
  // Deduplicate by English name
  const seen = new Set();
  const result = [];
  for (const c of distances) {
    if (!seen.has(c.en)) {
      seen.add(c.en);
      result.push(c);
      if (result.length >= count) break;
    }
  }
  return result;
}

// ─── DOM refs ───
const sliderR = document.getElementById('sliderR');
const sliderG = document.getElementById('sliderG');
const sliderB = document.getElementById('sliderB');
const numR = document.getElementById('numR');
const numG = document.getElementById('numG');
const numB = document.getElementById('numB');
const valR = document.getElementById('valR');
const valG = document.getElementById('valG');
const valB = document.getElementById('valB');
const hexInput = document.getElementById('hexInput');

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

function update() {
  const r = clamp(+sliderR.value);
  const g = clamp(+sliderG.value);
  const b = clamp(+sliderB.value);

  // Sync inputs
  numR.value = r; numG.value = g; numB.value = b;
  valR.textContent = r; valG.textContent = g; valB.textContent = b;

  const hex = '#' + toHex2(r) + toHex2(g) + toHex2(b);
  const rgbStr = `rgb(${r}, ${g}, ${b})`;

  // Background
  document.body.style.backgroundColor = hex;

  // Hex input (only update if not focused, to avoid interrupting typing)
  if (document.activeElement !== hexInput) {
    hexInput.value = hex;
    hexInput.classList.remove('invalid');
  }

  // Center label
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const cl = document.getElementById('centerLabel');
  cl.textContent = hex;
  cl.style.color = lum > 128 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  cl.style.background = lum > 128 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

  // RGB info
  document.getElementById('rgbR').textContent = r;
  document.getElementById('rgbG').textContent = g;
  document.getElementById('rgbB').textContent = b;
  document.getElementById('rgbRh').textContent = '0x' + toHex2(r);
  document.getElementById('rgbGh').textContent = '0x' + toHex2(g);
  document.getElementById('rgbBh').textContent = '0x' + toHex2(b);

  // CMY info
  const cmy = rgbToCmy(r, g, b);
  document.getElementById('cmyC').textContent = cmy.c;
  document.getElementById('cmyM').textContent = cmy.m;
  document.getElementById('cmyY').textContent = cmy.y;
  document.getElementById('cmyCh').textContent = '0x' + toHex2(cmy.c);
  document.getElementById('cmyMh').textContent = '0x' + toHex2(cmy.m);
  document.getElementById('cmyYh').textContent = '0x' + toHex2(cmy.y);

  // HSB info
  const hsb = rgbToHsb(r, g, b);
  document.getElementById('hsbH').textContent = hsb.h + '°';
  document.getElementById('hsbS').textContent = hsb.s + '%';
  document.getElementById('hsbB').textContent = hsb.b + '%';
  document.getElementById('hsbHh').textContent = '0x' + toHex2(Math.round(hsb.h * 255 / 360));
  document.getElementById('hsbSh').textContent = '0x' + toHex2(Math.round(hsb.s * 255 / 100));
  document.getElementById('hsbBh').textContent = '0x' + toHex2(Math.round(hsb.b * 255 / 100));

  // Complementary color
  const cr = 255 - r, cg = 255 - g, cb = 255 - b;
  const compHex = '#' + toHex2(cr) + toHex2(cg) + toHex2(cb);
  document.getElementById('compPreview').style.backgroundColor = compHex;
  document.getElementById('compHex').textContent = compHex;
  document.getElementById('compR').textContent = cr;
  document.getElementById('compG').textContent = cg;
  document.getElementById('compB').textContent = cb;
  const compNearest = findNearestColors(cr, cg, cb, 1)[0];
  document.getElementById('compName').textContent = compNearest.ko + ' / ' + compNearest.en;

  // Color names
  const nearest = findNearestColors(r, g, b, 11);
  const best = nearest[0];
  document.getElementById('nameKo').textContent = best.ko;
  document.getElementById('nameEn').textContent = best.en;
  const distPct = Math.round(best.dist);
  document.getElementById('nameDist').textContent =
    best.dist < 1 ? '정확히 일치!' : `거리: ${distPct} (가까울수록 유사)`;

  // Nearest list
  const list = document.getElementById('nearestList');
  list.innerHTML = '';
  for (let i = 0; i < Math.min(10, nearest.length); i++) {
    const c = nearest[i];
    const div = document.createElement('div');
    div.className = 'nearest-item';
    div.innerHTML = `
      <div class="nearest-swatch" style="background:rgb(${c.r},${c.g},${c.b})"></div>
      <div style="flex:1">
        <div class="nearest-name-ko">${c.ko}</div>
        <div class="nearest-name-en">${c.en}</div>
      </div>
      <div class="nearest-hex">#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}</div>
    `;
    div.addEventListener('click', () => {
      sliderR.value = c.r; sliderG.value = c.g; sliderB.value = c.b;
      update();
    });
    list.appendChild(div);
  }
}

// Event listeners
sliderR.addEventListener('input', update);
sliderG.addEventListener('input', update);
sliderB.addEventListener('input', update);
numR.addEventListener('input', () => { sliderR.value = clamp(+numR.value); update(); });
numG.addEventListener('input', () => { sliderG.value = clamp(+numG.value); update(); });
numB.addEventListener('input', () => { sliderB.value = clamp(+numB.value); update(); });

// Copy on click
document.getElementById('compHex').addEventListener('click', () => {
  copyToClipboard(document.getElementById('compHex').textContent);
});

document.getElementById('centerLabel').addEventListener('click', () => {
  copyToClipboard(document.getElementById('centerLabel').textContent);
});

document.querySelectorAll('.info-section').forEach(section => {
  section.addEventListener('click', () => {
    const type = section.dataset.copyType;
    let text = '';
    if (type === 'rgb') {
      text = `rgb(${document.getElementById('rgbR').textContent}, ${document.getElementById('rgbG').textContent}, ${document.getElementById('rgbB').textContent})`;
    } else if (type === 'cmy') {
      text = `cmy(${document.getElementById('cmyC').textContent}, ${document.getElementById('cmyM').textContent}, ${document.getElementById('cmyY').textContent})`;
    } else if (type === 'hsb') {
      text = `hsb(${document.getElementById('hsbH').textContent}, ${document.getElementById('hsbS').textContent}, ${document.getElementById('hsbB').textContent})`;
    }
    if (text) copyToClipboard(text);
  });
});

// Hex input: accept direct entry like "FF0000" or "#FF0000"
hexInput.addEventListener('input', () => {
  const raw = hexInput.value.trim().replace(/^#/, '');
  const m = /^([0-9a-fA-F]{6})$/.exec(raw);
  if (m) {
    const r = parseInt(m[1].slice(0, 2), 16);
    const g = parseInt(m[1].slice(2, 4), 16);
    const b = parseInt(m[1].slice(4, 6), 16);
    sliderR.value = r; sliderG.value = g; sliderB.value = b;
    hexInput.classList.remove('invalid');
    update();
  } else {
    hexInput.classList.add('invalid');
  }
});
hexInput.addEventListener('blur', () => {
  const r = clamp(+sliderR.value);
  const g = clamp(+sliderG.value);
  const b = clamp(+sliderB.value);
  hexInput.value = '#' + toHex2(r) + toHex2(g) + toHex2(b);
  hexInput.classList.remove('invalid');
});

// Init
update();
