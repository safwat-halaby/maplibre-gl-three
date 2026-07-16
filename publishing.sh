#!/usr/bin/env bash

##### Initialization
set -euo pipefail
IFS=$'\n\t'
example_dir="www/examples/basic/maplibreGlThree-npm-example"
copy_npm_example() {
    local target_dir="$1"
    mkdir -p "$target_dir/src"
    # project root
    cp "$example_dir/package.json" "$target_dir/package.json"
    cp "$example_dir/webpack.config.js" "$target_dir/webpack.config.js"
    cp "$example_dir/tsconfig.json" "$target_dir/tsconfig.json"
    cp "$example_dir/index.html" "$target_dir/index.html"
    # src/
    cp "$example_dir/src/script.ts" "$target_dir/src/script.ts"
    cp "$example_dir/src/style.json" "$target_dir/src/style.json"
    cp "$example_dir/src/styles.css" "$target_dir/src/styles.css"
    cp "$example_dir/src/declarations.d.ts" "$target_dir/src/declerations.d.ts"
}

await_manual_action() {
    echo ""
    echo "$1"
    echo "(AWAITING USER ACTION - Press ENTER to continue) <<<<<<<<<<<<<<<<<<<<<<<<"
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
echoBold() {
    echo ""
    echo ">>>>>>>> $1"
    echo ""
}
trap cleanup EXIT


echoBold "Initial safety checks"
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
await_manual_action "Bump the version now in package.json and in CHANGELOG.md"

##### Obtain version from package.json
published_version="$(node -p "require('./package.json').version")"
release_name="v$published_version"
echoBold "Running semi-auto checklist for publishing $release_name"
if git rev-parse -q --verify "refs/tags/$release_name" >/dev/null; then
    echo "Git tag $release_name already exists."
    exit 1
fi

echoBold "Building project"
npm install
npm run build
npm run syncDeps

echoBold "Smoke test the localhost example"
./node-static-server.sh </dev/null &
static_server_pid="$!"
await_manual_action "Check the self-host example in a browser."
cleanup
static_server_pid=""

echoBold "dry-run npm-pack"
set -x
npm pack --dry-run
set +x 
echo "The tarball should include only the dist entrypoint, generated declarations, package metadata, README, license, and two wrapper files."
await_manual_action "Does the list of files make sense?"

echoBold "Creating package tarball"
set -x
tarball_name="$(npm pack | tail -n 1)"
set +x

echoBold "Smoke test a copy of the NPM example against the newly packed tarball"
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
await_manual_action "Smoke test the example that will soon open in a browser"
echo ""
cleanup
npm_start_pid=""
set -x
popd
set +x

echoBold "Last confirmations..."
set -x
npm whoami
npm publish --dry-run
set +x

echoBold "Dry run complete. Publish for real? Type 'publish' to continue:"
read -r answer
if [ "$answer" != "publish" ]; then
    echo "Publishing cancelled."
    exit 0
fi

set -x
npm publish "$tarball_name"
set +x

echoBold "POST-PUBLISH checks"
echo "Sleeping for 10 seconds to let the packages propogate"
sleep 10

echoBold "Smoke test NPM example with the freshly published version and update package.json of npm example"
set -x
pushd "$example_dir"
npm pkg set "dependencies.maplibre-gl-three=$published_version"
npm install
npm run build
npm start </dev/null &
npm_start_pid="$!"
set +x
await_manual_action "check the published package smoke test in the tab that will soon open"
echo ""
cleanup
npm_start_pid=""
set -x
popd
set +x

echoBold "Stage changed files, commit $release_name, and create tag $release_name"
set -x
git add -A
if git diff --cached --quiet; then
    git commit --allow-empty -m "$release_name"
else
    git commit -m "$release_name"
fi
git tag "$release_name"
git push origin master
git push origin "$release_name"
set +x

echoBold "Sleeping for 10 seconds to let the changes propogate"
sleep 10

echoBold "Smoke test CDN example works with the freshly published version"
./node-static-server.sh </dev/null &
static_server_pid="$!"
await_manual_action "check the CDN example in a browser"
cleanup
static_server_pid=""


echoBold "Published and smoke-tested successfully."
