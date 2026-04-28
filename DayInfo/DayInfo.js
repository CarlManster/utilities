(function () {
'use strict';

/* ================================================================
   Lunar calendar data (1900-2100, 201 entries)
   Encoding: bits 0-3  = leap month number (0 = none)
             bits 4-15 = month sizes (bit n+3 -> month n, 1=30d, 0=29d)
             bit 16    = leap month size (1=30d, 0=29d)
   ================================================================ */

var LUNAR_INFO = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2, // 1900
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977, // 1910
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970, // 1920
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950, // 1930
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557, // 1940
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0, // 1950
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0, // 1960
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6, // 1970
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570, // 1980
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0, // 1990
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5, // 2000
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930, // 2010
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530, // 2020
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45, // 2030
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0, // 2040
  0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06aa0,0x1a6c4,0x0aae0, // 2050
  0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4, // 2060
  0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0, // 2070
  0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160, // 2080
  0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252, // 2090
  0x0d520                                                                              // 2100
];

var LY_MIN = 1900;
var LY_MAX = 2100;
var DAY_MS = 86400000;
function DOW_SHORT_ARR() { var a = I18N.t('dow_short'); return Array.isArray(a) ? a : DOW_SHORT; }
function DOW_FULL_ARR()  { var a = I18N.t('dow_full');  return Array.isArray(a) ? a : DOW_FULL; }
function MONTH_SHORT_ARR() { var a = I18N.t('month_short'); return Array.isArray(a) ? a : MONTH_SHORT; }
var DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var DOW_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var TZ_OFFSETS = [
  -720,-660,-600,-570,-540,-480,-420,-360,-300,-240,-210,-180,-120,-60,
  0,60,120,180,210,240,270,300,330,345,360,390,420,480,525,540,570,
  600,630,660,720,765,780,840
];

function fmtTz(m) {
  var sign = m >= 0 ? '+' : '-';
  var a = Math.abs(m);
  var h = Math.floor(a / 60);
  var mm = a % 60;
  return 'UTC' + sign + h + (mm ? ':' + pad2(mm) : '');
}

/* -- Lunar utilities -- */

function leapMonth(y)  { return LUNAR_INFO[y - LY_MIN] & 0xf; }
function leapDays(y)   { return leapMonth(y) ? ((LUNAR_INFO[y - LY_MIN] & 0x10000) ? 30 : 29) : 0; }
function monthDays(y,m) { return (LUNAR_INFO[y - LY_MIN] & (0x10000 >> m)) ? 30 : 29; }

function yearDays(y) {
  var s = 348, info = LUNAR_INFO[y - LY_MIN];
  for (var i = 0x8000; i > 0x8; i >>= 1) { if (info & i) s++; }
  return s + leapDays(y);
}

/* -- Conversion -- */

function makeDate(y, m, d) {
  var dt = new Date(0);
  dt.setFullYear(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

var BASE = makeDate(1900, 1, 31);

function solarToLunar(sy, sm, sd) {
  if (sy < LY_MIN || sy > LY_MAX) return algoSolarToLunar(sy, sm, sd);

  var target = makeDate(sy, sm, sd);
  var offset = Math.round((target - BASE) / DAY_MS);
  if (offset < 0) return algoSolarToLunar(sy, sm, sd);

  var y, yDays;
  for (y = LY_MIN; y <= LY_MAX; y++) {
    yDays = yearDays(y);
    if (offset < yDays) break;
    offset -= yDays;
  }
  if (y > LY_MAX) return algoSolarToLunar(sy, sm, sd);

  var leap = leapMonth(y);
  var month = 0, isLeap = false, days;

  for (var m = 1; m <= 12; m++) {
    days = monthDays(y, m);
    if (offset < days) { month = m; break; }
    offset -= days;

    if (m === leap) {
      days = leapDays(y);
      if (offset < days) { month = m; isLeap = true; break; }
      offset -= days;
    }
  }

  if (!month) return algoSolarToLunar(sy, sm, sd);
  return { year: y, month: month, day: offset + 1, isLeap: isLeap };
}

function lunarToSolar(ly, lm, ld, isLeap) {
  if (ly < LY_MIN || ly > LY_MAX) return algoLunarToSolar(ly, lm, ld, isLeap);

  var offset = 0, y, m;
  for (y = LY_MIN; y < ly; y++) offset += yearDays(y);

  var leap = leapMonth(ly);
  for (m = 1; m < lm; m++) {
    offset += monthDays(ly, m);
    if (m === leap) offset += leapDays(ly);
  }

  if (isLeap && lm === leap) {
    offset += monthDays(ly, lm);
  }

  offset += ld - 1;

  var result = new Date(BASE.getTime() + offset * DAY_MS);
  return { year: result.getFullYear(), month: result.getMonth() + 1, day: result.getDate() };
}

/* -- Astronomical algorithm (Meeus) for dates outside 1900-2100 -- */

var RAD = Math.PI / 180;

function gregorianToJD(y, m, d) {
  if (m <= 2) { y--; m += 12; }
  var A = Math.floor(y / 100);
  var B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function jdToGregorian(jd) {
  jd += 0.5;
  var Z = Math.floor(jd);
  var alpha = Math.floor((Z - 1867216.25) / 36524.25);
  var A = Z + 1 + alpha - Math.floor(alpha / 4);
  var B = A + 1524;
  var C = Math.floor((B - 122.1) / 365.25);
  var D = Math.floor(365.25 * C);
  var E = Math.floor((B - D) / 30.6001);
  return {
    day:   B - D - Math.floor(30.6001 * E),
    month: E < 14 ? E - 1 : E - 13,
    year:  (E < 14 ? E - 1 : E - 13) > 2 ? C - 4716 : C - 4715
  };
}

function calcNewMoon(k) {
  var T = k / 1236.85, T2 = T*T, T3 = T2*T, T4 = T3*T;
  var J = 2451550.09766 + 29.530588861*k + 0.00015437*T2 - 0.00000015*T3 + 0.00000000073*T4;
  var E = 1 - 0.002516*T - 0.0000074*T2, E2 = E*E;
  var M  = (2.5534   + 29.10535670*k  - 0.0000014*T2 - 0.00000011*T3) * RAD;
  var Mp = (201.5643 + 385.81693528*k + 0.0107582*T2 + 0.00001238*T3 - 0.000000058*T4) * RAD;
  var F  = (160.7108 + 390.67050284*k - 0.0016118*T2 - 0.00000227*T3 + 0.000000011*T4) * RAD;
  var Om = (124.7746 - 1.56375588*k   + 0.0020672*T2 + 0.00000215*T3) * RAD;
  J += -0.40720*Math.sin(Mp) + 0.17241*E*Math.sin(M) + 0.01608*Math.sin(2*Mp)
     + 0.01039*Math.sin(2*F) + 0.00739*E*Math.sin(Mp-M) - 0.00514*E*Math.sin(Mp+M)
     + 0.00208*E2*Math.sin(2*M) - 0.00111*Math.sin(Mp-2*F) - 0.00057*Math.sin(Mp+2*F)
     + 0.00056*E*Math.sin(2*Mp+M) - 0.00042*Math.sin(3*Mp) + 0.00042*E*Math.sin(M+2*F)
     + 0.00038*E*Math.sin(M-2*F) - 0.00024*E*Math.sin(2*Mp-M) - 0.00017*Math.sin(Om)
     - 0.00007*Math.sin(Mp+2*M) + 0.00004*Math.sin(2*Mp-2*F) + 0.00004*Math.sin(3*M)
     + 0.00003*Math.sin(Mp+M-2*F) + 0.00003*Math.sin(2*Mp+2*F)
     - 0.00003*Math.sin(Mp+M+2*F) + 0.00003*Math.sin(Mp-M+2*F)
     - 0.00002*Math.sin(Mp-M-2*F) - 0.00002*Math.sin(3*Mp+M) + 0.00002*Math.sin(4*Mp);
  return J;
}

function solarLon(jd) {
  var T = (jd - 2451545.0) / 36525.0, T2 = T*T;
  var L0 = 280.46646 + 36000.76983*T + 0.0003032*T2;
  var M = (357.52911 + 35999.05029*T - 0.0001537*T2) * RAD;
  var C = (1.914602 - 0.004817*T - 0.000014*T2)*Math.sin(M)
        + (0.019993 - 0.000101*T)*Math.sin(2*M) + 0.000289*Math.sin(3*M);
  var lon = L0 + C - 0.00569 - 0.00478*Math.sin((125.04 - 1934.136*T)*RAD);
  return ((lon % 360) + 360) % 360;
}

function findTermJD(approxJD, lon) {
  var jd = approxJD;
  for (var i = 0; i < 50; i++) {
    var d = lon - solarLon(jd);
    if (d > 180) d -= 360; if (d < -180) d += 360;
    if (Math.abs(d) < 0.00001) break;
    jd += d * 365.25 / 360;
  }
  return jd;
}

function newMoonK(jd) {
  var k = Math.round((2000 + (jd - 2451545.0) / 365.25 - 2000) * 12.3685);
  for (var i = 0; i < 30 && calcNewMoon(k) > jd + 0.5; i++) k--;
  for (var i = 0; i < 30 && calcNewMoon(k+1) <= jd + 0.5; i++) k++;
  return k;
}

function hasMajorTerm(k) {
  var s = calcNewMoon(k), e = calcNewMoon(k+1);
  var yr = Math.round(2000 + ((s+e)/2 - 2451545.0) / 365.25);
  var am = [3,4,5,6,7,8,9,10,11,12,1,2];
  for (var t = 0; t < 12; t++) {
    var lon = (t * 30) % 360;
    for (var dy = -1; dy <= 1; dy++) {
      var tj = findTermJD(gregorianToJD(yr+dy, am[t], 21), lon);
      if (tj >= s && tj < e) return true;
    }
  }
  return false;
}

function algoSolarToLunar(sy, sm, sd) {
  try {
    var jd = gregorianToJD(sy, sm, sd);
    var k0 = newMoonK(jd);

    var g = jdToGregorian(calcNewMoon(k0));
    var day = Math.round(jd - gregorianToJD(g.year, g.month, g.day)) + 1;
    if (day < 1) { k0--; g = jdToGregorian(calcNewMoon(k0)); day = Math.round(jd - gregorianToJD(g.year, g.month, g.day)) + 1; }

    var wsA = findTermJD(gregorianToJD(sy-1, 12, 21), 270);
    var wsB = findTermJD(gregorianToJD(sy, 12, 21), 270);
    var kA = newMoonK(wsA), kB = newMoonK(wsB);

    var k11, ws1;
    if (k0 >= kB) {
      k11 = kB; ws1 = wsB;
      var wsC = findTermJD(gregorianToJD(sy+1, 12, 21), 270);
      var k11e = newMoonK(wsC);
    } else {
      k11 = kA; ws1 = wsA;
      var k11e = kB;
    }

    var n = k11e - k11, hasL = (n === 13), lk = -1;
    if (hasL) { for (var ki = k11; ki < k11e; ki++) { if (!hasMajorTerm(ki)) { lk = ki; break; } } }

    var mn = 11, il = false;
    for (var ki = k11+1; ki <= k0; ki++) {
      if (hasL && ki === lk) { if (ki === k0) { il = true; break; } continue; }
      mn++; if (mn > 12) mn = 1;
    }

    var wy = jdToGregorian(ws1).year;
    var ly = mn >= 11 ? wy : wy + 1;

    return { year: ly, month: mn, day: day, isLeap: il, approx: true };
  } catch(e) { return null; }
}

function algoLunarToSolar(ly, lm, ld, isLeap) {
  try {
    var wy = lm >= 11 ? ly : ly - 1;
    var ws1 = findTermJD(gregorianToJD(wy, 12, 21), 270);
    var ws2 = findTermJD(gregorianToJD(wy+1, 12, 21), 270);
    var k11 = newMoonK(ws1), k11e = newMoonK(ws2);

    var n = k11e - k11, hasL = (n === 13), lk = -1;
    if (hasL) { for (var ki = k11; ki < k11e; ki++) { if (!hasMajorTerm(ki)) { lk = ki; break; } } }

    var tk = k11, cm = 11;
    if (lm !== 11 || isLeap) {
      for (var ki = k11+1; ki < k11e+2; ki++) {
        if (hasL && ki === lk) { if (isLeap && cm === lm) { tk = ki; break; } continue; }
        cm++; if (cm > 12) cm = 1;
        if (cm === lm && !isLeap) { tk = ki; break; }
      }
    }

    var g = jdToGregorian(calcNewMoon(tk));
    var r = jdToGregorian(gregorianToJD(g.year, g.month, g.day) + (ld - 1));
    return { year: r.year, month: r.month, day: r.day };
  } catch(e) { return null; }
}

/* -- Holiday API (data.go.kr) -- */

var holidayCache = {};
var divisionsCache = {};
var fetchingMonths = {};

function getServiceKey() {
  return Settings.get('dayInfo.apikey') || '';
}

function setServiceKey(key) {
  Settings.set('dayInfo.apikey', key);
}

function removeServiceKey() {
  Settings.set('dayInfo.apikey', '');
}

var apiKeyError = false;

function updateKeyButton() {
  var btn = document.getElementById('btnApiKey');
  btn.classList.remove('active', 'error');
  if (apiKeyError) {
    btn.classList.add('error');
    btn.textContent = I18N.t('api_key_error', 'API Key Error');
  } else if (getServiceKey()) {
    btn.classList.add('active');
    btn.textContent = I18N.t('api_key_set', 'API Key Set');
  } else {
    btn.textContent = I18N.t('api_key', 'API Key');
  }
}

function checkApiResponse(data) {
  try {
    var code = data.response.header.resultCode;
    if (code !== '00') {
      apiKeyError = true;
      updateKeyButton();
      return false;
    }
  } catch (e) {
    apiKeyError = true;
    updateKeyButton();
    return false;
  }
  return true;
}

function promptServiceKey() {
  var current = getServiceKey();
  var msg = current
    ? I18N.t('prompt_edit_key', 'Enter your service key.\n(Leave empty to remove the key.)')
    : I18N.t('prompt_enter_key', 'Enter your service key.\n(Encoded key from data.go.kr)');
  var key = prompt(msg, current);
  if (key === null) return;
  apiKeyError = false;
  if (key.trim() === '') {
    removeServiceKey();
    holidayCache = {};
    divisionsCache = {};
  } else {
    setServiceKey(key.trim());
    holidayCache = {};
    divisionsCache = {};
  }
  updateKeyButton();
  render();
}

function fetchHolidayMonth(yearMonth) {
  var parts = yearMonth.split('-');
  var serviceKey = getServiceKey();
  var url = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo'
    + '?solYear=' + parts[0]
    + '&solMonth=' + parts[1]
    + '&ServiceKey=' + serviceKey
    + '&_type=json'
    + '&numOfRows=50';

  return fetch(url)
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    })
    .then(function (text) {
      var data;
      try { data = JSON.parse(text); } catch (e) {
        apiKeyError = true;
        updateKeyButton();
        holidayCache[yearMonth] = {};
        return;
      }
      var map = {};
      if (!checkApiResponse(data)) { holidayCache[yearMonth] = map; return; }
      try {
        var body = data.response.body;
        if (body.totalCount > 0 && body.items && body.items.item) {
          var items = body.items.item;
          if (!Array.isArray(items)) items = [items];
          for (var i = 0; i < items.length; i++) {
            if (items[i].isHoliday === 'Y') {
              var dk = '' + items[i].locdate;
              if (!map[dk]) map[dk] = [];
              map[dk].push(items[i].dateName);
            }
          }
        }
      } catch (e) { }
      holidayCache[yearMonth] = map;
    })
    .catch(function () {
      apiKeyError = true;
      updateKeyButton();
      holidayCache[yearMonth] = {};
    });
}

function fetchDivisionsMonth(yearMonth) {
  var parts = yearMonth.split('-');
  var serviceKey = getServiceKey();
  var url = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo'
    + '?solYear=' + parts[0]
    + '&solMonth=' + parts[1]
    + '&ServiceKey=' + serviceKey
    + '&_type=json'
    + '&numOfRows=10';

  return fetch(url)
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    })
    .then(function (text) {
      var data;
      try { data = JSON.parse(text); } catch (e) {
        apiKeyError = true;
        updateKeyButton();
        divisionsCache[yearMonth] = {};
        return;
      }
      var map = {};
      if (!checkApiResponse(data)) { divisionsCache[yearMonth] = map; return; }
      try {
        var body = data.response.body;
        if (body.totalCount > 0 && body.items && body.items.item) {
          var items = body.items.item;
          if (!Array.isArray(items)) items = [items];
          for (var i = 0; i < items.length; i++) {
            var dk = '' + items[i].locdate;
            map[dk] = items[i].dateName;
          }
        }
      } catch (e) { }
      divisionsCache[yearMonth] = map;
    })
    .catch(function () {
      apiKeyError = true;
      updateKeyButton();
      divisionsCache[yearMonth] = {};
    });
}

function ensureHolidays(months) {
  if (!getServiceKey()) return;

  var needHoliday = months.filter(function (k) { return !(k in holidayCache) && !fetchingMonths['h-' + k]; });
  var needDivision = months.filter(function (k) { return !(k in divisionsCache) && !fetchingMonths['d-' + k]; });

  if (needHoliday.length === 0 && needDivision.length === 0) return;

  needHoliday.forEach(function (k) { fetchingMonths['h-' + k] = true; });
  needDivision.forEach(function (k) { fetchingMonths['d-' + k] = true; });

  var fetches = needHoliday.map(fetchHolidayMonth).concat(needDivision.map(fetchDivisionsMonth));

  Promise.all(fetches).then(function () {
    needHoliday.forEach(function (k) { delete fetchingMonths['h-' + k]; });
    needDivision.forEach(function (k) { delete fetchingMonths['d-' + k]; });
    render();
  });
}

function getHolidaysFromCache(sy, sm, sd) {
  var monthKey = sy + '-' + pad2(sm);
  var dateKey = '' + sy + pad2(sm) + pad2(sd);
  if (!holidayCache[monthKey]) return [];
  return holidayCache[monthKey][dateKey] || [];
}

function getDivisionFromCache(sy, sm, sd) {
  var monthKey = sy + '-' + pad2(sm);
  var dateKey = '' + sy + pad2(sm) + pad2(sd);
  if (!divisionsCache[monthKey]) return '';
  return divisionsCache[monthKey][dateKey] || '';
}

/* -- Date utilities -- */

function solarDaysInMonth(y, m) {
  if (m === 2) return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28;
  return [0, 31, 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];
}

function lunarDaysInMonth(y, m, isLeap) {
  if (y < LY_MIN || y > LY_MAX) return 30;
  if (isLeap) return leapDays(y);
  return monthDays(y, m);
}

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function fmtDate(y, m, d) { return y + '.' + pad2(m) + '.' + pad2(d); }

function weekStartOf(date) {
  var d = new Date(date.getTime());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/* -- UI -- */

var calType     = document.getElementById('calType');
var yearInput   = document.getElementById('yearInput');
var monthSelect = document.getElementById('monthSelect');
var daySelect   = document.getElementById('daySelect');
var tzSelect    = document.getElementById('tzSelect');
var leapField   = document.getElementById('leapField');
var leapCheck   = document.getElementById('leapCheck');
var weekGrid    = document.getElementById('weekGrid');
var infoBanner  = document.getElementById('infoBanner');

function init() {
  var now = new Date();
  yearInput.value = now.getFullYear();

  for (var m = 1; m <= 12; m++) {
    var _m = MONTH_SHORT_ARR();
    monthSelect.add(new Option(_m[m] || MONTH_SHORT[m], m));
  }
  monthSelect.value = now.getMonth() + 1;

  // Timezone dropdown
  var localOffset = -now.getTimezoneOffset(); // minutes east of UTC
  var closestIdx = 0;
  var closestDiff = Infinity;
  for (var t = 0; t < TZ_OFFSETS.length; t++) {
    tzSelect.add(new Option(fmtTz(TZ_OFFSETS[t]), TZ_OFFSETS[t]));
    var diff = Math.abs(TZ_OFFSETS[t] - localOffset);
    if (diff < closestDiff) { closestDiff = diff; closestIdx = t; }
  }
  tzSelect.value = TZ_OFFSETS[closestIdx];

  refreshDays();
  daySelect.value = now.getDate();

  calType.addEventListener('change', onChange);
  yearInput.addEventListener('change', onYearChange);
  yearInput.addEventListener('input', onYearChange);
  monthSelect.addEventListener('change', onChange);
  daySelect.addEventListener('change', function () { render(); });
  tzSelect.addEventListener('change', function () { render(); validateEpochInput(); });
  document.getElementById('weekCount').addEventListener('change', function () { render(); });
  leapCheck.addEventListener('change', onChange);

  document.getElementById('btnPrevWeek').addEventListener('click', function () { shiftDay(-7); });
  document.getElementById('btnPrev').addEventListener('click', function () { shiftDay(-1); });
  document.getElementById('btnNext').addEventListener('click', function () { shiftDay(1); });
  document.getElementById('btnNextWeek').addEventListener('click', function () { shiftDay(7); });
  document.getElementById('btnToday').addEventListener('click', goToday);
  document.getElementById('btnApiKey').addEventListener('click', promptServiceKey);
  document.getElementById('btnEpochGo').addEventListener('click', applyEpoch);
  document.getElementById('epochInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') applyEpoch();
  });
  document.getElementById('epochInput').addEventListener('input', validateEpochInput);

  updateKeyButton();
  render();
}

function onYearChange() {
  clearEpochError();
  var v = parseInt(yearInput.value, 10);
  if (!isNaN(v) && (v < 1 || v > 5000)) {
    showEpochError(I18N.t('error_year_range', 'Year must be between 1 and 5000.'));
    return;
  }
  refreshLeap();
  refreshDays();
  render();
}

function onChange() {
  clearEpochError();
  refreshLeap();
  refreshDays();
  render();
}

function showEpochError(msg) {
  var el = document.getElementById('epochError');
  el.textContent = msg;
  el.hidden = false;
}

function clearEpochError() {
  document.getElementById('epochError').hidden = true;
}

function shiftDay(delta) {
  var y = parseInt(yearInput.value, 10);
  var m = parseInt(monthSelect.value, 10);
  var d = parseInt(daySelect.value, 10);
  if (!y || !m || !d) return;

  if (calType.value === 'solar') {
    var dt = makeDate(y, m, d);
    dt.setDate(dt.getDate() + delta);
    setSolarDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  } else {
    var solar = lunarToSolar(y, m, d, leapCheck.checked);
    if (!solar) return;
    var dt2 = makeDate(solar.year, solar.month, solar.day);
    dt2.setDate(dt2.getDate() + delta);
    var lunar = solarToLunar(dt2.getFullYear(), dt2.getMonth() + 1, dt2.getDate());
    if (!lunar) return;
    setLunarDate(lunar.year, lunar.month, lunar.day, lunar.isLeap);
  }
}

function goToday() {
  var now = new Date();
  calType.value = 'solar';
  setSolarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

var _dMin = new Date(Date.UTC(0, 0, 1)); _dMin.setUTCFullYear(1);
var _dMax = new Date(Date.UTC(0, 0, 1)); _dMax.setUTCFullYear(5001);
var EPOCH_BASE_MIN = Math.floor(_dMin.getTime() / 1000);
var EPOCH_BASE_MAX = Math.floor(_dMax.getTime() / 1000) - 1;

function epochRange() {
  var off = parseInt(tzSelect.value, 10) * 60;
  return { min: EPOCH_BASE_MIN - off, max: EPOCH_BASE_MAX - off };
}

function validateEpochInput() {
  clearEpochError();
  var raw = document.getElementById('epochInput').value.trim();
  if (raw === '') return;
  var epoch = Number(raw);
  if (!Number.isFinite(epoch) || Math.floor(epoch) !== epoch) {
    showEpochError(I18N.t('error_invalid_epoch', 'Invalid value. Please enter an integer (seconds).'));
  } else {
    var r = epochRange();
    if (epoch < r.min || epoch > r.max) {
      showEpochError(I18N.t('error_epoch_range', 'Out of range. Must be between year 1 and year 5000 (' + fmtTz(parseInt(tzSelect.value,10)) + ').', {tz: fmtTz(parseInt(tzSelect.value,10))}));
    }
  }
}

function applyEpoch() {
  var input = document.getElementById('epochInput');
  var raw = input.value.trim();

  clearEpochError();

  if (raw === '') return;

  var epoch = Number(raw);
  if (!Number.isFinite(epoch) || Math.floor(epoch) !== epoch) {
    showEpochError(I18N.t('error_invalid_epoch', 'Invalid value. Please enter an integer (seconds).'));
    return;
  }

  var r = epochRange();
  if (epoch < r.min || epoch > r.max) {
    showEpochError(I18N.t('error_epoch_range', 'Out of range. Must be between year 1 and year 5000 (' + fmtTz(parseInt(tzSelect.value,10)) + ').', {tz: fmtTz(parseInt(tzSelect.value,10))}));
    return;
  }

  // Convert epoch to date in selected timezone using JD (avoids Date object issues)
  var tzOffsetMin = parseInt(tzSelect.value, 10);
  var jd = 2440587.5 + (epoch + tzOffsetMin * 60) / 86400;
  var g = jdToGregorian(jd);

  if (g.year < 1 || g.year > 5000) {
    showEpochError(I18N.t('error_epoch_range', 'Out of range. Must be between year 1 and year 5000 (' + fmtTz(tzOffsetMin) + ').', {tz: fmtTz(tzOffsetMin)}));
    return;
  }

  calType.value = 'solar';
  setSolarDate(g.year, g.month, g.day);
}

function setSolarDate(y, m, d) {
  yearInput.value = y;
  refreshLeap();
  refreshDays();
  monthSelect.value = m;
  refreshDays();
  daySelect.value = d;
  refreshLeap();
  render();
}

function setLunarDate(y, m, d, isLeap) {
  yearInput.value = y;
  monthSelect.value = m;
  refreshLeap();
  leapCheck.checked = isLeap && !leapField.hidden;
  refreshDays();
  daySelect.value = d;
  render();
}

function refreshLeap() {
  var isLunar = calType.value === 'lunar';
  var y = parseInt(yearInput.value, 10);
  var m = parseInt(monthSelect.value, 10);

  if (isLunar && y >= LY_MIN && y <= LY_MAX && leapMonth(y) === m) {
    leapField.hidden = false;
  } else {
    leapField.hidden = true;
    leapCheck.checked = false;
  }
}

function refreshDays() {
  var y = parseInt(yearInput.value, 10) || new Date().getFullYear();
  var m = parseInt(monthSelect.value, 10) || 1;
  var isLunar = calType.value === 'lunar';
  var isLeap = leapCheck.checked;

  var max = isLunar ? lunarDaysInMonth(y, m, isLeap) : solarDaysInMonth(y, m);
  var cur = parseInt(daySelect.value, 10) || 1;

  daySelect.innerHTML = '';
  for (var d = 1; d <= max; d++) {
    daySelect.add(new Option(d, d));
  }
  daySelect.value = Math.min(cur, max);

  refreshLeap();
}

function render() {
  var y = parseInt(yearInput.value, 10);
  var m = parseInt(monthSelect.value, 10);
  var d = parseInt(daySelect.value, 10);
  if (!y || !m || !d) return;

  var isLunar = calType.value === 'lunar';
  var isLeap = leapCheck.checked;
  var solarDate;

  if (isLunar) {
    var conv = lunarToSolar(y, m, d, isLeap);
    if (!conv) {
      showBanner(I18N.t('error_lunar_convert', 'Unable to convert the given lunar date.'));
      weekGrid.innerHTML = '';
      return;
    }
    solarDate = makeDate(conv.year, conv.month, conv.day);
  } else {
    solarDate = makeDate(y, m, d);
  }

  hideBanner();

  var solY = isLunar ? conv.year : y;
  var solM = isLunar ? conv.month : m;
  var solD = isLunar ? conv.day : d;
  var selTz = parseInt(tzSelect.value, 10);
  document.getElementById('epochInput').value =
    Math.round((gregorianToJD(solY, solM, solD) - 2440587.5) * 86400) - selTz * 60;

  var ws = weekStartOf(solarDate);
  var selectedTime = solarDate.getTime();
  var todayNow = new Date();
  var todayKey = fmtDate(todayNow.getFullYear(), todayNow.getMonth() + 1, todayNow.getDate());

  weekGrid.innerHTML = '';

  var wc = parseInt(document.getElementById('weekCount').value, 10) || 3;
  var beforeWeeks = Math.floor(wc / 2);
  var totalDays = wc * 7;

  var startDate = new Date(ws.getTime());
  startDate.setDate(ws.getDate() - beforeWeeks * 7);

  var neededMonths = {};

  for (var i = 0; i < totalDays; i++) {
    var date = new Date(startDate.getTime());
    date.setDate(startDate.getDate() + i);

    var sy = date.getFullYear();
    var sm = date.getMonth() + 1;
    var sd = date.getDate();
    var dow = date.getDay();

    neededMonths[sy + '-' + pad2(sm)] = true;

    var isSelected = (date.getTime() === selectedTime);
    var isToday = (fmtDate(sy, sm, sd) === todayKey);
    var weekIndex = Math.floor(i / 7);

    var lunar = solarToLunar(sy, sm, sd);
    var holidays = getHolidaysFromCache(sy, sm, sd);
    var isHoliday = holidays.length > 0;
    var division = getDivisionFromCache(sy, sm, sd);

    var card = document.createElement('article');
    card.className = 'day-card';
    if (isSelected) card.classList.add('selected');
    if (isToday) card.classList.add('today');
    if (weekIndex !== beforeWeeks) card.classList.add('other-week');
    if (dow === 0 || isHoliday) card.classList.add('holiday');
    else if (dow === 6) card.classList.add('saturday');

    var _dow = DOW_SHORT_ARR(); var _dowF = DOW_FULL_ARR(); var _mon = MONTH_SHORT_ARR();
    var html = '';
    html += '<div class="day-dow">' + (_dow[dow] || DOW_SHORT[dow]);
    if (division) html += '<span class="day-division">' + division + '</span>';
    html += '</div>';
    html += '<div class="day-num">' + sd + '</div>';
    html += '<div class="day-date"><span class="date-label">' + I18N.t('label_solar', 'Solar') + '</span>' + fmtDate(sy, sm, sd) + '</div>';

    if (lunar) {
      var leapMark = lunar.isLeap ? I18N.t('lunar_leap', ' (Leap)') : '';
      var approxMark = lunar.approx ? I18N.t('lunar_approx', ' (?)') : '';
      html += '<div class="day-lunar"><span class="date-label">' + I18N.t('label_lunar', 'Lunar') + '</span>' + fmtDate(lunar.year, lunar.month, lunar.day) + leapMark + approxMark + '</div>';
    } else {
      html += '<div class="day-lunar dim"><span class="date-label">' + I18N.t('label_lunar', 'Lunar') + '</span>' + I18N.t('lunar_na', 'N/A') + '</div>';
    }

    var tzOffsetMin = parseInt(tzSelect.value, 10);
    var epoch = Math.round((gregorianToJD(sy, sm, sd) - 2440587.5) * 86400) - tzOffsetMin * 60;
    html += '<div class="day-epoch" data-epoch="' + epoch + '" data-i18n-title="click_to_copy" title="' + I18N.t('click_to_copy', 'Click to copy') + '">'
          + '<span class="epoch-label">' + I18N.t('label_timestamp', 'Timestamp') + '</span>'
          + '<span class="epoch-value">' + epoch + '</span></div>';

    for (var h = 0; h < holidays.length; h++) {
      html += '<div class="day-holiday">' + holidays[h] + '</div>';
    }

    card.innerHTML = html;

    card.setAttribute('aria-label',
      (_dowF[dow] || DOW_FULL[dow]) + ', ' + (_mon[sm] || MONTH_SHORT[sm]) + ' ' + sd + ', ' + sy +
      (holidays.length ? ', ' + holidays.join(', ') : '') +
      (isSelected ? ' ' + I18N.t('aria_selected', '(selected)') : '') +
      (isToday ? ' ' + I18N.t('aria_today', '(today)') : '')
    );
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.style.cursor = 'pointer';

    (function (solarY, solarM, solarD, lunarInfo) {
      function onClick(e) {
        if (e.target.closest('.day-epoch')) return;
        if (calType.value === 'lunar' && lunarInfo) {
          setLunarDate(lunarInfo.year, lunarInfo.month, lunarInfo.day, lunarInfo.isLeap);
        } else {
          setSolarDate(solarY, solarM, solarD);
        }
      }
      card.addEventListener('click', onClick);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      });
    })(sy, sm, sd, lunar);

    weekGrid.appendChild(card);
  }

  ensureHolidays(Object.keys(neededMonths));
  updateNavButtons();
}

function updateNavButtons() {
  var y = parseInt(yearInput.value, 10);
  var m = parseInt(monthSelect.value, 10);
  var d = parseInt(daySelect.value, 10);
  var prevWeek = document.getElementById('btnPrevWeek');
  var prev = document.getElementById('btnPrev');
  var next = document.getElementById('btnNext');
  var nextWeek = document.getElementById('btnNextWeek');

  var atMin, atMax;
  if (calType.value === 'solar') {
    atMin = (y <= 1 && m <= 1 && d <= 1);
    atMax = (y >= 5000 && m >= 12 && d >= 31);
  } else {
    atMin = (y <= 1 && m <= 1 && d <= 1);
    atMax = (y >= 5000 && m >= 12 && d >= 30);
  }
  prev.disabled = atMin;
  prevWeek.disabled = atMin;
  next.disabled = atMax;
  nextWeek.disabled = atMax;
}

function showBanner(msg) {
  infoBanner.textContent = msg;
  infoBanner.hidden = false;
}

function hideBanner() {
  infoBanner.hidden = true;
}

/* -- Toast -- */

var toastTimer = null;

function showToast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2000);
}

weekGrid.addEventListener('click', function (e) {
  var epochEl = e.target.closest('.day-epoch');
  if (!epochEl) return;
  e.stopPropagation();
  var val = epochEl.getAttribute('data-epoch');
  navigator.clipboard.writeText(val).then(function () {
    showToast(I18N.t('copied', 'Copied: ' + val, {value: val}));
  });
});

if (window.__UNITTEST__) {
  window._DayInfo = {
    solarToLunar: solarToLunar, lunarToSolar: lunarToSolar,
    gregorianToJD: gregorianToJD, jdToGregorian: jdToGregorian,
    calcNewMoon: calcNewMoon, solarLon: solarLon,
    solarDaysInMonth: solarDaysInMonth, lunarDaysInMonth: lunarDaysInMonth,
    leapMonth: leapMonth, leapDays: leapDays, monthDays: monthDays, yearDays: yearDays,
    pad2: pad2, fmtDate: fmtDate, fmtTz: fmtTz,
    algoSolarToLunar: algoSolarToLunar, algoLunarToSolar: algoLunarToSolar
  };
} else {
  Settings.ready.then(function () { init(); });
}

})();
