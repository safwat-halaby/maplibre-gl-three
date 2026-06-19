set -euo pipefail
IFS=$'\n\t'
if [ ! -d "utils/express-static-server/node_modules" ]; then
    echo ""
    echo "#####################   NPM CHECKER   ######################"
    echo ""
    echo "Missing node_modules in utils/express-static-server/node_modules"
    echo -n "Run npm install? [y/n]: "
    read answer
    if [ "$answer" == "y" ]; then
        cd "utils/express-static-server"
        npm install
        cd "../../"
    fi
    echo ""
    echo "############################################################"
fi
node utils/express-static-server/static-server.js 6153