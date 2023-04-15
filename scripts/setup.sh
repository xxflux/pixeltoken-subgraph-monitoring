#!/bin/bash

#//////////////////////////////////////////////////////////////////////
#// GIT_LOCATION is where you check out the automation script
GIT_LOCATION=$(pwd)
#//////////////////////////////////////////////////////////////////////
#// APP_LOCATION is where automation script
APP_LOCATION="/var/app/automation"

function _deploy(){
  echo "deploy automation app"
  echo $GIT_LOCATION
  echo $APP_LOCATION
  if [ ! -d $APP_LOCATION ]
  then
    echo "creating app dir - $APP_LOCATION"
    sudo mkdir $APP_LOCATION
    sudo rsync -avz --exclude=node_modules --exclude=.git* --exclude=contracts --exclude=hardhat.config.js --exclude=README.md --exclude=tmp_thegraph_* $GIT_LOCATION/ $APP_LOCATION/
  else
    echo "found /var/app/automation, cp app to /var/app/automation"
    sudo rsync -avz --exclude=node_modules --exclude=.git* --exclude=contracts --exclude=hardhat.config.js --exclude=README.md --exclude=tmp_thegraph_* $GIT_LOCATION/ $APP_LOCATION/
  fi

  echo "Dont forget you have to set .env file in $APP_LOCATION, also double check data/auto_manager_wallet_decrypted!!!"
  echo "Dont forget you need to do $npm install in /var/app/automation!!!"
}

function _setcron(){
  cd $APP_LOCATION

  # change executable script location in crontab source file
  ESC_APP_LOCATION=$(echo $APP_LOCATION | sed 's;/;\\/;g')
  sed "s/APP_LOCATION/$ESC_APP_LOCATION/" cron/crontabSetting_sed > cron/crontabSetting
  #cat cron/crontabSetting

  # change file permission of crontab source file
  chmod 600 cron/crontabSetting

  # view Root’s Cron Jobs
  crontab -l

  # later we need to set crontab under operation user
  crontab cron/crontabSetting
  #crontab -r
  crontab -l

  # let user know where to debug
  echo "crontab setting is done. do sudo tail -f /var/log/automation.log"
}

function _callSwitch(){
  ACTION=$1
  case $ACTION in
    "deploy")
      _deploy
    ;;
    "setcron")
      _setcron
    ;;
  esac
}

for arg in "$@"
do
    case $arg in
      -a|--action)
        shift
        ACTION_CALL="$1"
        _callSwitch "$ACTION_CALL"
        ;;
      *)
        echo "You need -a flag"
    	  ;;
    esac
done
