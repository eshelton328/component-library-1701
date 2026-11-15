#!/usr/bin/env node
// Fails when a step of `pnpm verify` has no `run: pnpm <step>` line in the
// CI workflow. CI runs each check as its own job, so a step added to
// verify and not to CI would pass locally and never run on a PR.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const pkg: unknown = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const scripts = isRecord(pkg) ? pkg['scripts'] : undefined
const verify = isRecord(scripts) && typeof scripts['verify'] === 'string' ? scripts['verify'] : ''
const steps = verify.split('&&').map((s) => s.trim().replace(/^pnpm\s+/, ''))
const ci = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8')
const missing = steps.filter((s) => !new RegExp(`^\\s*- run: pnpm ${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(ci))
const ok = steps.length > 0 && missing.length === 0
console.log(JSON.stringify({ ok, steps: steps.length, missing }))
process.exit(ok ? 0 : 1)
