apt update
apt install nano
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 14.15.3
nvm use 14.15.3
wget https://cmake.org/files/v3.12/cmake-3.12.3.tar.gz
tar zxvf cmake-3.12.3.tar.gz
cd cmake-3.12.3
./bootstrap --prefix=/usr/local
make -j$(nproc)
make install
cmake --version
npm i -g npm@6
npm install