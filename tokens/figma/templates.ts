// The scripts that the Figma MCP tool `use_figma` runs inside the Figma
// file. render() puts the data in place of __DATA__. They are plain
// JavaScript for Figma's plugin runtime, kept here as strings so that
// ESLint and tsc do not parse them as repository code. They use no
// backticks, so they fit in these template literals unchanged.

/**
 * Creates a variable collection and its modes when they are missing, then
 * creates or updates each variable by name. A rerun is safe. A variable in
 * Figma that the data does not have is reported in extraInFigma, never
 * deleted.
 */
export const upsertTemplate = `const DATA = __DATA__;
const cols = await figma.variables.getLocalVariableCollectionsAsync();
let col = cols.find(c => c.name === DATA.name);
const createdCollection = !col;
if (!col) col = figma.variables.createVariableCollection(DATA.name);
const modeIds = {};
for (const [i, m] of DATA.modes.entries()) {
  let mode = col.modes.find(x => x.name === m);
  if (!mode && i === 0 && col.modes.length === 1 && !DATA.modes.includes(col.modes[0].name)) {
    col.renameMode(col.modes[0].modeId, m);
    mode = col.modes[0];
  }
  modeIds[m] = mode ? mode.modeId : col.addMode(m);
}
const all = await figma.variables.getLocalVariablesAsync();
const mine = new Map(all.filter(v => v.variableCollectionId === col.id).map(v => [v.name, v]));
const aliasCol = DATA.aliasFrom ? cols.find(c => c.name === DATA.aliasFrom) : null;
if (DATA.aliasFrom && !aliasCol) throw new Error('Missing collection ' + DATA.aliasFrom);
const aliasPool = aliasCol ? new Map(all.filter(v => v.variableCollectionId === aliasCol.id).map(v => [v.name, v])) : new Map();
let created = 0, updated = 0;
for (const d of DATA.vars) {
  let v = mine.get(d.n);
  if (!v) { v = figma.variables.createVariable(d.n, col, d.t); created++; }
  else {
    if (v.resolvedType !== d.t) throw new Error(d.n + ' is ' + v.resolvedType + ', expected ' + d.t);
    updated++;
  }
  v.scopes = d.s;
  v.description = d.d || '';
  v.hiddenFromPublishing = !!d.h;
  if (d.w) v.setVariableCodeSyntax('WEB', d.w);
  for (const [m, val] of Object.entries(d.v || {})) v.setValueForMode(modeIds[m], val);
  for (const [m, target] of Object.entries(d.a || {})) {
    const t = aliasPool.get(target);
    if (!t) throw new Error(d.n + ': alias target ' + target + ' not found in ' + DATA.aliasFrom);
    v.setValueForMode(modeIds[m], { type: 'VARIABLE_ALIAS', id: t.id });
  }
}
const names = new Set(DATA.vars.map(d => d.n));
const extra = [...mine.keys()].filter(n => !names.has(n));
return { collection: { id: col.id, name: col.name, created: createdCollection, modes: modeIds }, created, updated, total: DATA.vars.length, extraInFigma: extra };`

/** Creates or updates each text style by name and binds its font family to a variable. */
export const textStylesTemplate = `const DATA = __DATA__;
const all = await figma.variables.getLocalVariablesAsync('STRING');
const fontVars = new Map(all.map(v => [v.name, v]));
const styles = await figma.getLocalTextStylesAsync();
const byName = new Map(styles.map(s => [s.name, s]));
const twins = styles.filter(s => styles.some(o => o !== s && o.name === s.name) && DATA.some(d => d.name === s.name));
if (twins.length) throw new Error('Text styles with the same name: ' + twins.map(s => s.name + ' ' + s.id).join(', '));
const weight = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };
let created = 0, updated = 0;
for (const d of DATA) {
  const fv = fontVars.get(d.fontFamilyVariable);
  if (!fv) throw new Error('Missing font variable ' + d.fontFamilyVariable);
  const family = Object.values(fv.valuesByMode)[0];
  const style = weight[d.fontWeight];
  if (!style) throw new Error(d.name + ': no style for weight ' + d.fontWeight);
  await figma.loadFontAsync({ family, style });
  let s = byName.get(d.name);
  if (!s) { s = figma.createTextStyle(); s.name = d.name; created++; } else updated++;
  s.fontName = { family, style };
  s.fontSize = d.fontSize;
  s.lineHeight = { unit: 'PERCENT', value: d.lineHeightPercent };
  s.letterSpacing = { unit: 'PIXELS', value: d.letterSpacingPx };
  s.textCase = d.textCase;
  s.description = d.description || '';
  s.setBoundVariable('fontFamily', fv);
}
return { created, updated, total: DATA.length };`

/**
 * Read-only. Returns one FNV-1a hash for each variable and text style in
 * the file. expectedHashes() in lib.ts makes the same hashes from the
 * tokens, so a reply of about 10 KB verifies every value.
 */
export const fingerprintScript = `const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const f4 = x => x.toFixed(4);
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const colById = new Map(cols.map(c => [c.id, c]));
const all = await figma.variables.getLocalVariablesAsync();
const byId = new Map(all.map(v => [v.id, v]));
const val = x => x && x.type === 'VARIABLE_ALIAS' ? '@' + (byId.get(x.id)?.name ?? '?') : typeof x === 'object' ? [x.r, x.g, x.b, x.a].map(f4).join(',') : typeof x === 'number' ? f4(x) : String(x);
const out = {};
for (const v of all) {
  const c = colById.get(v.variableCollectionId);
  const modes = [...c.modes].sort((a, b) => a.name < b.name ? -1 : 1).map(m => m.name + '=' + val(v.valuesByMode[m.modeId])).join(';');
  out['var|' + c.name + '|' + v.name] = fnv([v.resolvedType, [...v.scopes].sort().join(','), v.codeSyntax.WEB || '', v.hiddenFromPublishing ? 1 : 0, v.description || '', modes].join('|'));
}
for (const s of await figma.getLocalTextStylesAsync()) {
  const b = s.boundVariables?.fontFamily;
  const lh = s.lineHeight.unit === 'AUTO' ? 'AUTO|' : s.lineHeight.unit + '|' + s.lineHeight.value.toFixed(2);
  const key = 'style|' + s.name;
  // A second style with the same name gets its own key, so the compare
  // reports it as extra, with its ID.
  out[key in out ? key + '|duplicate|' + s.id : key] = fnv([s.fontName.style, f4(s.fontSize), lh, s.letterSpacing.unit, f4(s.letterSpacing.value), s.textCase, b ? byId.get(b.id)?.name : '', s.description || ''].join('|'));
}
return out;`
