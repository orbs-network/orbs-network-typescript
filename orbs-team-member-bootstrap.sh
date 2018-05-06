#!/bin/bash

# Prepare a fresh MacOS for Orbs Platform development.
# Some of the packages can be substituted for others and some are purely for convenience.
# It is required that zsh be the default shell - the script will prompt you if this is not the case, and explain what to do.

NODE_VER="v9.11.1"
NVM_INSTALL_URL="https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh"
BREW_INSTALL_URL="https://raw.githubusercontent.com/Homebrew/install/master/install"
# OH_MY_ZSH_URL="https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh"

CASK_PACKAGES="java8 google-chrome visual-studio-code iterm2 slack docker sourcetree"
PACKAGES="typescript yarn docker-completion docker-compose-completion docker-machine-completion"

FAILED_PACKAGES=""

exit_with_message() 
{  
  echo "Failed: ${1-}";
  exit 1;
}

install_oh_my_zsh() {
  if [[ $(echo $SHELL | grep -c zsh) -eq 0 ]] ; then
    echo "zsh must be the default shell. Please run 'chsh -s /bin/zsh', close and reopen the terminal and rerun the script."
    exit 1
  fi

  echo "Detected zsh as the default shell."

  echo "Installing Oh My Zsh ..."
  sh -c "$(curl -fsSL ${OH_MY_ZSH_URL})"

  if [[ $? -eq 0 ]] ; then
    exit_with_message "Oh My Zsh failed to install. Please restart shell and run this script again."
  fi
}

install_nvm_and_node()
{
  echo "Installing NVM ..."
  curl -o- ${NVM_INSTALL_URL} | bash

  # Allow nvm to run in the current session (so user doens't have to stop, restart session and rerun)
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

  [ "$(command -v nvm)" != "nvm" ] && exit_with_message "NVM failed to install, or shell needs to be restarted. Please restart shell and run this script again."

  echo "nvm installed successfully, installing Node version ${NODE_VER} ..."

  nvm install ${NODE_VER}
}

install_brew_and_cask()
{
  if [[ ! -f /usr/local/bin/brew ]] ; then
    echo "Installing brew ..."
    /usr/bin/ruby -e "$(curl -fsSL ${BREW_INSTALL_URL})"
    if [[ $? -ne 0 ]] ; then
      exit_with_message "Failed to install brew, cannot continue"
    fi
  else
    echo "Brew already installed, skipping"
  fi

  echo "Installing cask ..."
  brew tap caskroom/cask
  brew tap caskroom/versions
  if [[ $? -ne 0 ]] ; then
    exit_with_message "Failed to install cask, cannot continue"
  fi
}

install_cask_packages()
{
  echo "Installing cask packages ..."
  for cask_package in ${CASK_PACKAGES} ; do
    brew cask install ${cask_package}
    if [[ $? -ne 0 ]] ; then
      echo "Failed to install package ${cask_package}"
      FAILED_PACKAGES="${FAILED_PACKAGES} ${cask_package}"
    fi
  done
}

install_brew_packages()
{
  echo "Installing brew packages ..."
  for package in ${PACKAGES} ; do
    brew install ${package}
    if [[ $? -ne 0 ]] ; then
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
  if [[ $? -ne 0 ]] ; then
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

# ==================== START ====================

echo
echo "Welcome to Orbs, dear ${USER}!"
echo
echo "This script installs software that you will use as a software engineer at Orbs."
echo "After installing software, you will be asked if you would like to run build (it takes several minutes to run)."
echo "If you want to run build later, you can answer 'n', then rerun the script and answer 'y'."
echo "During installation, the script you will occasionally be asked for your MacOS password."
echo
echo "It is safe to run this script multiple times."
echo
echo "Node.js version to install: ${NODE_VER}."
echo "If you need to change that, quit now (^C) and change NODE_VER variable at the top of the script."
echo
read -rsn1 -p"Press any key to begin";echo

# This is causing trouble and not critical as the moment so not installing it
#install_oh_my_zsh

touch ~/.bash_profile

install_nvm_and_node
install_brew_and_cask
install_cask_packages
install_brew_packages

if [[ $(command -v java | grep -c java) -eq 0 ]] ; then
  exit_with_message "Java failed to install, or shell needs to be restarted. Please restart shell and run this script again."
fi
if [[ $(command -v docker | grep -c docker) -eq 0 ]] ; then
  exit_with_message "Java failed to install, or shell needs to be restarted. Please restart shell and run this script again."
fi

# This is not called by default as not everyone needs it. Uncomment and rerun to install it.
# install_android 

echo "Installed Node version: $(node -v)"
echo "Installed NPM version: $(npm -v)"
echo "Installed Java version: $(java -version 2>&1 | head -1)"
echo "Installed Docker version: $(docker -v)"

echo "Running post-installation actions ..."

if [[ $(grep -c JAVA_HOME ~/.bash_profile) -eq 0 ]] ; then
  echo 'export JAVA_HOME=$(/usr/libexec/java_home)' >> ~/.bash_profile
fi

source ~/.bash_profile


if [[ -n ${FAILED_PACKAGES} ]] ; then
  echo "The following packages failed to install: ${FAILED_PACKAGES}"
  echo "Try to install manually or rerun the script."
fi



echo "The script can now run build. If you choose to run it, it will run and then exit. Otherwise it will exit now."
echo "If you wish to run build later, rerun the script and answer 'y'."
echo
read -r -p "Would you like to run build now? [y/N] " response
if [[ "${response-}" == "Y" ]] || [[ "${response-}" == "y" ]] ; then
  echo "Will run build"
  run_build
  echo
  echo "Orbs MVP Build complete."
  echo
else
  echo "Skipped build"
fi

echo

echo "Productivity tip: to set your key repeat rate faster than what System Preferences UI would let you, run the following, then logout and log back in:"
echo "defaults write NSGlobalDomain KeyRepeat -int 1"
echo "defaults write NSGlobalDomain InitialKeyRepeat -int 10"

echo
echo "Installation complete, thank you for your patience."
echo "Please restart the current session for changes to take effect."
echo
echo

exit 0


