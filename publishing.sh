#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

example_dir="www/examples/basic/maplibreGlThree-npm-example"

copy_npm_example() {
    local target_dir="$1"
    mkdir -p "$target_dir/src"
    cp "$example_dir/package.json" "$target_dir/package.json"
    cp "$example_dir/webpack.config.js" "$target_dir/webpack.config.js"
    cp "$example_dir/index.html" "$target_dir/index.html"
    cp "$example_dir/src/script.js" "$target_dir/src/script.js"
    cp "$example_dir/src/style.json" "$target_dir/src/style.json"
    cp "$example_dir/src/styles.css" "$target_dir/src/styles.css"
}

pause_for_enter() {
    read -r dummy </dev/tty
}

static_server_pid=""
npm_start_pid=""
cleanup() {
    if [ -n "$static_server_pid" ]; then
        kill "$static_server_pid" 2>/dev/null || true
        wait "$static_server_pid" 2>/dev/null || true
    fi
    if [ -n "$npm_start_pid" ]; then
        kill "$npm_start_pid" 2>/dev/null || true
        wait "$npm_start_pid" 2>/dev/null || true
    fi
}
trap cleanup EXIT

if [ "$(git rev-parse --is-inside-work-tree)" != "true" ]; then
    echo "This script must be run inside a git worktree."
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "Git worktree is not clean. Commit, stash, or discard changes before publishing."
    git status --short
    exit 1
fi

echo 'Confirm `package.json` has the intended `name`, `version`, `description`, `license`, `exports`, `files`, `peerDependencies`, and `devDependencies`'
echo "You should probably BUMP the version right now"
pause_for_enter

published_version="$(node -p "require('./package.json').version")"
release_name="v$published_version"
echo ">>>>>>>> Running semi-auto checklist for publishing $release_name"

if git rev-parse -q --verify "refs/tags/$release_name" >/dev/null; then
    echo "Git tag $release_name already exists."
    exit 1
fi

set -x
npm install
npm pack --dry-run
set +x

echo ">>>>>>>> Does the list of files make sense?"
echo ">>>>>>>> The tarball should include only the package entrypoint, package metadata, README, license, and two wrapper files."
pause_for_enter

echo ">>>>>>>> Smoke test the localhost example"
./node-static-server.sh </dev/null &
static_server_pid="$!"
echo ">>>>>>>> Press Enter after checking the self-host example in a browser."
pause_for_enter
cleanup
static_server_pid=""

echo ">>>>>>>> Creating package tarball"
set -x
tarball_name="$(npm pack | tail -n 1)"
set +x

echo ">>>>>>>> Smoke test a copy of the NPM example against the newly packed tarball"
tmpdir="$(mktemp -d)"
set -x
copy_npm_example "$tmpdir"
cp "$tarball_name" "$tmpdir/$tarball_name"
pushd "$tmpdir"
npm pkg set "dependencies.maplibre-gl-three=file:./$tarball_name"
npm install
npm start </dev/null &
npm_start_pid="$!"
set +x
echo "Press ENTER checking the packed tarball smoke test in the opened browser tab."
pause_for_enter
echo ""
cleanup
npm_start_pid=""
set -x
popd
set +x

echo ">>>>>>>> Make sure the CDN example has the newest $published_version before publishing."
node utils/update_dependencies.js

echo ">>>>>>>> Last confirmations..."
set -x
npm whoami
npm publish --dry-run
set +x

echo ">>>>>>>> Dry run complete. Publish for real? Type 'publish' to continue:"
read -r answer
if [ "$answer" != "publish" ]; then
    echo "Publishing cancelled."
    exit 0
fi

set -x
npm publish "$tarball_name"
set +x


echo ">>>>>>>> Stage changed files, commit $release_name, and create tag $release_name"
set -x
git add -A
if git diff --cached --quiet; then
    git commit --allow-empty -m "$release_name"
else
    git commit -m "$release_name"
fi
git tag "$release_name"
git push master
git push "$release_name"
set +x

echo ">>>>>>>> Smoke test NPM example with the freshly published version and update package.json of npm example"
set -x
pushd "$example_dir"
npm pkg set "dependencies.maplibre-gl-three=$published_version"
npm install
npm run build
npm start </dev/null &
npm_start_pid="$!"
set +x
echo ">>>>>>>> Press ENTER after checking the published package smoke test in the opened browser tab."
pause_for_enter
echo ""
cleanup
npm_start_pid=""
set -x
popd
set +x

echo ">>>>>>>> Smoke test CDN example works with the freshly published version"
./node-static-server.sh </dev/null &
static_server_pid="$!"
echo ">>>>>>>> Press Enter after checking the self-host example in a browser."
pause_for_enter
cleanup
static_server_pid=""


echo ">>>>>>>> Published and smoke-tested successfully."
