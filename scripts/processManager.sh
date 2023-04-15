#!/bin/bash
# shell script log goes to /tmp/stdout.log
# shell script error log goes to /tmp/stderr.log

#NODE_EXE="/usr/local/bin/node"
APP_LOCATION="/var/app/automation"
NODE_EXE="node"

TIMESTAMP=$(date +"%m-%d-%Y-%r")
TIMESTAMP_UNIX=$(date +%s)


#################################
# Helpers
#################################
function _log(){
  echo "[$(basename $0)][$TIMESTAMP($TIMESTAMP_UNIX)] $1"
}
function _allinone(){
  #
}

function _listenFromGraph(){
  echo "Running execute_call.js listenFromGraph"
  echo "$NODE_EXE $APP_LOCATION/scripts/execute_call.js listenFromGraph"
  cd $APP_LOCATION
  pwd
  $NODE_EXE scripts/execute_call.js listenFromGraph
}

function _getTerminalPoolTx(){
  echo "Running execute_call.js getTerminalPoolTx"
  echo "$NODE_EXE $APP_LOCATION/scripts/execute_call.js getTerminalPoolTx"
  cd $APP_LOCATION
  pwd
  $NODE_EXE scripts/execute_call.js getTerminalPoolTx
}

function _getOriginationPoolTx(){
  echo "Running execute_call.js getOriginationPoolTx"
  echo "$NODE_EXE $APP_LOCATION/scripts/execute_call.js getOriginationPoolTx"
  cd $APP_LOCATION
  pwd
  $NODE_EXE scripts/execute_call.js getOriginationPoolTx
}



function _callSwitch(){
  ACTION=$1
  case $ACTION in
    "allinone")
      _allinone
    ;;
    "listenFromGraph")
      _listenFromGraph
    ;;
    "getTerminalPoolTx")
      _getTerminalPoolTx
    ;;
    "getOriginationPoolTx")
      _getOriginationPoolTx
    ;;
  esac
}


# Default values of arguments
TMP_PROJECT_DIRECTORY="/etc/projects"
TMP_OTHER_ARGUMENTS=()

for arg in "$@"
do
    case $arg in
      -h|--help)
        echo "options:"
        echo "-h, --help                show brief help"
        echo "-a, --action              specify an action to use[monitoringTerminalAPI, preprocess, execute_call_test, postprocess]"
        echo "-d, --directory           specify project dir to use"
        exit 0
        ;;
      -a|--action)
        shift
        ACTION_CALL="$1"
        _callSwitch "$ACTION_CALL"
        ;;
      -d|--directory)
        TMP_PROJECT_DIRECTORY="$2"
        shift
        ;;
      *)
        TMP_OTHER_ARGUMENTS+=("$4")
        shift
        ;;
    esac
done

echo "\n# Action call: $ACTION_CALL"
echo "# Root directory: $TMP_PROJECT_DIRECTORY"
echo "# Other arguments: ${TMP_OTHER_ARGUMENTS[*]}"
