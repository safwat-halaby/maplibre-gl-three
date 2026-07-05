set -euo pipefail
IFS=$'\n\t'

root_node_modules_missing=false
www_dependencies_missing=false
express_server_node_modules_missing=false

if [ ! -d "www/dependencies" ]; then
    www_dependencies_missing=true
    if [ ! -d "node_modules" ]; then
        root_node_modules_missing=true
    fi
fi

if [ ! -d "utils/express-static-server/node_modules" ]; then
    express_server_node_modules_missing=true
fi

if $root_node_modules_missing || $www_dependencies_missing || $express_server_node_modules_missing; then
    echo ""
    echo "######################### Dependency checker #########################"
    echo ""

    if $express_server_node_modules_missing; then
        echo "Missing node_modules in utils/express-static-server/node_modules"
        echo "These are needed to run a basic static server."
        echo -n "Run npm install for utils/express-static-server? [y/n]: "
        read answer
        if [ "$answer" == "y" ]; then
            cd "utils/express-static-server"
            npm install
            cd "../../"
        fi
        echo ""
    fi

    if $www_dependencies_missing; then
        echo "If you want the self-host example to work, we need to copy"
        echo "some files from node_modules/ to www/dependencies/"
        echo -n "Would you like to perform the copy? [y/n]: "
        read answer
        if [ "$answer" == "y" ]; then
            if $root_node_modules_missing; then
                echo ""
                echo "Missing node_modules/ - Run npm install first?"
                echo "Choosing yes will perform an npm install in the root directory,"
                echo -n "immediately followed by the copy [y/n]: " 
                read answer
                if [ "$answer" == "y" ]; then
                    npm install
                    root_node_modules_missing=false
                fi
                echo ""
            fi
            if $root_node_modules_missing; then
                echo "Copy cancelled."
            else
                node utils/update_dependencies.js
            fi 
        fi
        echo ""
    fi

    echo "######################### END dependency checker #########################"
    echo
fi
node utils/express-static-server/static-server.js 6153
