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
const same = cols.filter(c => c.name === DATA.name);
if (same.length > 1) throw new Error('Collections with the same name: ' + same.map(c => c.name + ' ' + c.id).join(', '));
let col = same[0];
const all = await figma.variables.getLocalVariablesAsync();
// Stop before any change when two variables in the collection share a name.
const twins = col ? all.filter(v => v.variableCollectionId === col.id && all.some(o => o !== v && o.variableCollectionId === col.id && o.name === v.name)) : [];
if (twins.length) throw new Error('Variables with the same name in ' + DATA.name + ': ' + twins.map(v => v.name + ' ' + v.id).join(', '));
const createdCollection = !col;
if (!col) col = figma.variables.createVariableCollection(DATA.name);
// A hidden collection is left out when the library is published.
col.hiddenFromPublishing = false;
const modeIds = {};
for (const [i, m] of DATA.modes.entries()) {
  let mode = col.modes.find(x => x.name === m);
  if (!mode && i === 0 && col.modes.length === 1 && !DATA.modes.includes(col.modes[0].name)) {
    col.renameMode(col.modes[0].modeId, m);
    mode = col.modes[0];
  }
  modeIds[m] = mode ? mode.modeId : col.addMode(m);
}
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
  else if (v.codeSyntax.WEB !== undefined) v.removeVariableCodeSyntax('WEB');
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

/**
 * Creates or updates each text style by name and binds its font family to
 * a variable, then runs the effect styles (__EFFECT_STYLES__) in the same
 * call. The reply's created, updated and total count the text styles.
 */
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
  // The tokens set none of these, so each one goes back to Figma's default.
  s.textDecoration = 'NONE';
  s.paragraphSpacing = 0;
  s.paragraphIndent = 0;
  s.listSpacing = 0;
  s.leadingTrim = 'NONE';
  s.hangingPunctuation = false;
  s.hangingList = false;
  s.textWrapStyle = 'AUTO';
  // Only the font family is bound to a variable; clear any other binding.
  for (const k of Object.keys(s.boundVariables || {})) if (k !== 'fontFamily') s.setBoundVariable(k, null);
  s.description = d.description || '';
  s.setBoundVariable('fontFamily', fv);
}
__EFFECT_STYLES__
return { created, updated, total: DATA.length, effectStyles };`

/**
 * A part of the text-styles script: creates or updates each drop-shadow
 * effect style by name and binds its colour to a Color variable, so the
 * style follows the Dark and Light modes. It sets effectStyles to its counts.
 */
export const effectStylesTemplate = `const EFFECTS = __EFFECTS__;
const colorCol = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === 'Color');
if (!colorCol && EFFECTS.length) throw new Error('Missing collection Color');
const colorVars = new Map((await figma.variables.getLocalVariablesAsync('COLOR')).filter(v => colorCol && v.variableCollectionId === colorCol.id).map(v => [v.name, v]));
const effects = await figma.getLocalEffectStylesAsync();
const effectByName = new Map(effects.map(s => [s.name, s]));
const effectTwins = effects.filter(s => effects.some(o => o !== s && o.name === s.name) && EFFECTS.some(d => d.name === s.name));
if (effectTwins.length) throw new Error('Effect styles with the same name: ' + effectTwins.map(s => s.name + ' ' + s.id).join(', '));
let effectsCreated = 0, effectsUpdated = 0;
for (const d of EFFECTS) {
  const cv = colorVars.get(d.colorVariable);
  if (!cv) throw new Error('Missing Color variable ' + d.colorVariable);
  let s = effectByName.get(d.name);
  if (!s) { s = figma.createEffectStyle(); s.name = d.name; effectsCreated++; } else effectsUpdated++;
  const shadow = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 1 }, offset: { x: d.offsetX, y: d.offsetY }, radius: d.radius, spread: d.spread, visible: true, blendMode: 'NORMAL', showShadowBehindNode: false };
  s.effects = [figma.variables.setBoundVariableForEffect(shadow, 'color', cv)];
  s.description = d.description || '';
}
const effectStyles = { created: effectsCreated, updated: effectsUpdated, total: EFFECTS.length };`

/**
 * Read-only. Returns one FNV-1a hash for each variable, text style and effect style in
 * the file, with a key of its own for a second item of the same name.
 * expectedHashes() in lib.ts makes the same hashes from the
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
for (const c of cols) {
  const ckey = 'col|' + c.name;
  out[ckey in out ? ckey + '|duplicate|' + c.id : ckey] = fnv([c.modes.map(m => m.name).sort().join(','), c.hiddenFromPublishing ? 1 : 0].join('|'));
}
for (const v of all) {
  const c = colById.get(v.variableCollectionId);
  const modes = [...c.modes].sort((a, b) => a.name < b.name ? -1 : 1).map(m => m.name + '=' + val(v.valuesByMode[m.modeId])).join(';');
  const vkey = 'var|' + c.name + '|' + v.name;
  out[vkey in out ? vkey + '|duplicate|' + v.id : vkey] = fnv([v.resolvedType, [...v.scopes].sort().join(','), v.codeSyntax.WEB || '', v.hiddenFromPublishing ? 1 : 0, v.description || '', modes].join('|'));
}
for (const s of await figma.getLocalTextStylesAsync()) {
  const b = s.boundVariables?.fontFamily;
  const lh = s.lineHeight.unit === 'AUTO' ? 'AUTO|' : s.lineHeight.unit + '|' + s.lineHeight.value.toFixed(2);
  const key = 'style|' + s.name;
  // A second style with the same name gets its own key, so the compare
  // reports it as extra, with its ID.
  out[key in out ? key + '|duplicate|' + s.id : key] = fnv([s.fontName.style, f4(s.fontSize), lh, s.letterSpacing.unit, f4(s.letterSpacing.value), s.textCase, s.textDecoration, f4(s.paragraphSpacing), f4(s.paragraphIndent), f4(s.listSpacing), s.leadingTrim, s.hangingPunctuation ? 1 : 0, s.hangingList ? 1 : 0, s.textWrapStyle, Object.keys(s.boundVariables || {}).sort().join(','), b ? byId.get(b.id)?.name : '', s.description || ''].join('|'));
}
for (const s of await figma.getLocalEffectStylesAsync()) {
  // A bound colour is hashed by its variable's name; that variable's values are hashed above.
  const fx = s.effects.map(e => {
    const bound = e.boundVariables || {};
    const shadow = e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW';
    const colour = !shadow ? '' : bound.color ? '@' + (byId.get(bound.color.id)?.name ?? '?') : [e.color.r, e.color.g, e.color.b, e.color.a].map(f4).join(',');
    return [e.type, shadow ? f4(e.offset.x) : '', shadow ? f4(e.offset.y) : '', f4(e.radius), shadow ? f4(e.spread || 0) : '', e.visible ? 1 : 0, e.blendMode || '', e.showShadowBehindNode ? 1 : 0, Object.keys(bound).sort().join(','), colour].join('|');
  });
  const key = 'effect|' + s.name;
  out[key in out ? key + '|duplicate|' + s.id : key] = fnv([s.effects.length, ...fx, s.description || ''].join('|'));
}
return out;`
