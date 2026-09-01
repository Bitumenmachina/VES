#!/usr/bin/env bash
# selftest.sh — proves the verifier's exit-code contract on a synthetic fixture.
# Run from the repo root: bash test/selftest.sh   (needs only node)
# Writes its baseline/manifest into a temp dir; never touches tools/*.json.
set -u
cd "$(dirname "$0")/.." || exit 3
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
F=test/fixture.html
cp "$F" "$T/fixture.html"
cat > "$T/config.json" <<JSON
{ "file": "$T/fixture.html", "egressBaseline": "$T/baseline.json", "freezeManifest": "$T/manifest.json" }
JSON
V="node tools/ves-verify.mjs --config $T/config.json"
pass=0; fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "PASS  $1 (exit $3)"; pass=$((pass+1)); else echo "FAIL  $1 (expected $2, got $3)"; fail=$((fail+1)); fi
}
$V >/dev/null 2>&1; check "first run, no baseline -> finding"              1 $?
$V --write-baseline --write-manifest >/dev/null 2>&1; check "write baseline+manifest" 0 $?
$V >/dev/null 2>&1; check "clean file -> PASS"                               0 $?
sed 's/return q \* r;/return q * r * 1;/' "$F" > "$T/fixture.html"
$V >/dev/null 2>&1; check "frozen region edited -> FREEZE fail"             1 $?
sed 's|console.log(el \&\& el.textContent);|console.log(el \&\& el.textContent); fetch("https://example.com/x");|' "$F" > "$T/fixture.html"
$V >/dev/null 2>&1; check "new fetch( outside region -> EGRESS fail"        1 $?
sed 's|(function(){ const el|(function(){ const el = ;|' "$F" > "$T/fixture.html"
$V >/dev/null 2>&1; check "syntax broken -> SYNTAX fail"                    1 $?
cp "$F" "$T/fixture.html"
node tools/ves-verify.mjs --config /nonexistent.json >/dev/null 2>&1; check "no target file -> usage exit 3" 3 $?
# Stop hook contract, using the same temp config via CLAUDE_PROJECT_DIR-independent --config is not
# available to the hook, so exercise the hook with a temp copy of the config in place.
cp tools/ves-verify.config.json "$T/config.bak"
cp "$T/config.json" tools/ves-verify.config.json
sed 's|console.log(el \&\& el.textContent);|console.log(el \&\& el.textContent); fetch("https://example.com/x");|' "$F" > "$T/fixture.html"
echo '{}' | node tools/ves-stop-hook.mjs >/dev/null 2>&1; check "stop hook, failing file -> block (exit 2)" 2 $?
echo '{"stop_hook_active":true}' | node tools/ves-stop-hook.mjs >/dev/null 2>&1; check "stop hook, already blocked once -> allow (exit 0)" 0 $?
cp "$F" "$T/fixture.html"
echo '{}' | node tools/ves-stop-hook.mjs >/dev/null 2>&1; check "stop hook, passing file -> allow (exit 0)" 0 $?
cp "$T/config.bak" tools/ves-verify.config.json
echo "selftest: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
