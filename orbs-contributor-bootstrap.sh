#!/bin/bash

# Prepare a fresh MacOS for Orbs Platform development.
# Some of the packages can be substituted for others and some are purely for convenience.

# mkdir -p ${DEV_HOME}
# cd ${DEV_HOME}
# git clone ${ORBS_NETWORK_REPO}
# cd ${ORBS_NETWORK_HOME} || { echo "Failed to create ${DEV_HOME} or failed to clone ${ORBS_NETWORK_REPO}. Cannot continue."; exit 1;}


DEV_HOME=${HOME}/dev/orbs
NODE_VER="v9.11.1"

CASK_PACKAGES="google-chrome visual-studio-code iterm2 atom slack java8 docker sourcetree spectacle alfred"
PACKAGES="node@8 typescript yarn"

FAILED_PACKAGES=""
ORBS_NETWORK_REPO="https://github.com/orbs-network/orbs-network.git"
ORBS_NETWORK_HOME=${DEV_HOME}/orbs-network


exit_with_message() 
{  
  echo "Failed: ${1-}"; 
  exit 1;
}

install_nvm_and_node()
{
  echo "Installing NVM ..."
  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

  # Allow nvm to run in the current session (so user doens't have to stop, restart session and rerun)
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

  [ "$(command -v nvm)" != "nvm" ] && exit_on_fail 1 "NVM failed to install, or shell needs to be restarted. Please restart shell and run this script again.."

  echo "nvm installed successfully, installing Node version ${NODE_VER} ..."

  nvm install ${NODE_VER}
}

install_brew_and_cask()
{
  if [ ! -f /usr/local/bin/brew ] ; then
    echo "Installing brew..."
    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    [ $? -ne 0 ] && exit_with_message "Failed to install brew, cannot continue"
  else
    echo "Brew already installed, skipping"
  fi

  echo "Installing cask..."
  brew tap caskroom/cask
  [ $? -ne 0 ] && exit_with_message "Failed to install cask, cannot continue"
}

install_cask_packages()
{
  echo "Installing cask packages..."
  for cask_package in ${CASK_PACKAGES} ; do
    brew cask install ${cask_package}
    if [ $? -ne 0 ] ; then
      echo "Failed to install package ${cask_package}"
      FAILED_PACKAGES="${FAILED_PACKAGES} ${cask_package}"
    fi
  done
}

install_brew_packages()
{
  echo "Installing brew packages..."
  for package in ${PACKAGES} ; do
    brew install ${package}
    if [ $? -ne 0 ] ; then
      echo "Failed to install package ${package}"
      FAILED_PACKAGES="${FAILED_PACKAGES} ${package}"
    fi
  done
}

install_android()
{
  ANDROID_PACKAGES="gradle android-sdk android-ndk"

  echo "Installing Android SDK packages ..."

  for package in ${ANDROID_PACKAGES} ; do
  echo "brew install ${package}"
  if [ $? -ne 0 ] ; then
    echo "Failed to install package ${package}"
    FAILED_PACKAGES="${FAILED_PACKAGES} ${package}"
  fi
  done

  android update --no-ui

  echo "Android SDK installed."
}

run_build()
{
  ./install.sh
  ./build.sh

  ./docker/build-server-base.sh && ./docker-build.sh
  ./docker/build-sdk-base.sh && ./docker/build-sdk.sh
  ./docker/build-sdk-base.sh && ./docker/build-e2e.sh

}

// ==================== START ====================

echo
echo "Welcome dear ${USER}!"
echo
echo "This script installs software that you will use as an Orbs Platform contributor."
echo "It will occasionally ask for your MacOS password, please stay next to your computer during installation."
echo "You can run it multiple times with no harm done."
echo
echo "The last step is running the MVP build. It is a long process so you can safely ^C it if you don't need it. It's the last step of this script anyway."
echo
echo "Node version to install: ${NODE_VER}."
echo "If you need to change it, quit now (^C) and change NODE_VER variable at the top of the script."
read -rsn1 -p"Press any key to continue";echo

echo "Installing Oh My Zsh (alternative shell) ..."
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"

# [ -f /tmp/idontexist ] && (exit_with_message "Sorry byebye")

install_nvm_and_node

install_brew_and_cask

install_cask_packages
install_brew_packages

# Don't install android for now
# install_android 

echo "Running post-installation actions..."

if [ $(grep -c JAVA_HOME ~/.zshrc) -eq 0 ] ; then
  echo 'export JAVA_HOME=$(/usr/libexec/java_home)' >> ~/.zshrc
fi

source ~/.zshrc

echo "Node version: $(node -v)"
echo |"NPM version: $(npm -v)"

if [ -n ${FAILED_PACKAGES} ] ; then
  echo "The following packages failed to install, try to install them manually: ${FAILED_PACKAGES}"
fi

echo "Running Orbs MVP build, this will take a while..."

run_build

echo
echo "Orbs MVP Build complete."
echo

echo "Nice tip: if you want to set your key repeat rate faster than System Preferences would let you, run the following, then logout and log back in:"
echo "defaults write NSGlobalDomain KeyRepeat -int 1"
echo "defaults write NSGlobalDomain InitialKeyRepeat -int 10"

echo
echo "Installation complete, thank you for your patience."
echo "Please restart the current session for some of the changes to take effect."
echo
echo

exit 0


