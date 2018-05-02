#!/bin/sh

# Prepare a fresh MacOS for Orbs Platform development.
# Some of the packages can be substituted for others and some are purely for convenience.

# mkdir -p ${DEV_HOME}
# cd ${DEV_HOME}
# git clone ${ORBS_NETWORK_REPO}
# cd ${ORBS_NETWORK_HOME} || { echo "Failed to create ${DEV_HOME} or failed to clone ${ORBS_NETWORK_REPO}. Cannot continue."; exit 1;}


DEV_HOME=${HOME}/dev/orbs

CASK_PACKAGES="google-chrome visual-studio-code iterm2 atom slack java8 docker sourcetree spectacle alfred"
PACKAGES="node@8 typescript yarn"

FAILED_PACKAGES=""
ORBS_NETWORK_REPO="https://github.com/orbs-network/orbs-network.git"
ORBS_NETWORK_HOME=${DEV_HOME}/orbs-network

echo
echo "Welcome dear ${USER}!"
echo
echo "This script installs software that you will use as an Orbs Platform contributor."
echo "It will occasionally ask for your MacOS password, please stay next to your computer during installation."
echo "You can run it multiple times with no harm done."
echo
read -rsn1 -p"Press any key to continue";echo

echo "Installing Oh My Zsh (alternative shell)..."
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"

echo ""
if [ ! -f /usr/local/bin/brew ] ; then
  echo "Installing brew..."
  /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
  if [ $? -ne 0 ] ; then
    echo "Failed to install brew, cannot continue"
    exit 1
  fi
else
  echo "Brew already installed, skipping"
fi

echo "Updating brew..."
brew update

echo "Installing cask..."
brew tap caskroom/cask
if [ $? -ne 0 ] ; then
  echo "Failed to install cask, cannot continue"
  exit 1
fi

#brew install brew-cask
brew tap caskroom/versions

rc=$?
if [ $rc -ne 0 ] ; then
  echo "Error installing brew, cannot proceed!"
  exit $rc
fi

echo "Installing cask packages..."
for cask_package in ${CASK_PACKAGES} ; do
  echo "brew cask install ${cask_package}"
  if [ $? -ne 0 ] ; then
    echo "Failed to install package ${cask_package}"
    FAILED_PACKAGES="${FAILED_PACKAGES} ${cask_package}"
  fi
done

echo "Installing brew packages..."
for package in ${PACKAGES} ; do
  echo "brew install ${package}"
  if [ $? -ne 0 ] ; then
    echo "Failed to install package ${package}"
    FAILED_PACKAGES="${FAILED_PACKAGES} ${package}"
  fi
done



#ANDROID_PACKAGES="gradle android-sdk android-ndk"

#echo "Installing Android SDK packages ..."

#for package in ${ANDROID_PACKAGES} ; do
#  echo "brew install ${package}"
#  if [ $? -ne 0 ] ; then
#    echo "Failed to install package ${package}"
#    FAILED_PACKAGES="${FAILED_PACKAGES} ${package}"
#  fi
#done


#android update --no-ui

#echo "Android SDK installed."

echo "Running post-installation actions..."

if [ $(grep -c NODE_PATH ~/.zshrc) -eq 0 ] ; then
  echo 'export NODE_PATH="/usr/local/opt/node@8/bin"' >> ~/.zshrc
  echo 'export PATH="$NODE_PATH:$PATH"' >> ~/.zshrc
fi

if [ $(grep -c JAVA_HOME ~/.zshrc) -eq 0 ] ; then
  echo 'export JAVA_HOME=$(/usr/libexec/java_home)' >> ~/.zshrc
fi

source ~/.zshrc

echo "Node version: $(node -v)"
echo |"NPM version: $(npm -v)"

if [ -n ${FAILED_PACKAGES}] ; then
  echo "The following packages failed to install, try to install them manually: ${FAILED_PACKAGES}"
fi

echo "Running build, this will take a while..."

./install.sh
./build.sh


echo "Installation complete, thank you for your patience."
echo
exit 0
