curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 14.15.3
nvm use 14.15.3
wget https://cmake.org/files/v3.12/cmake-3.12.3.tar.gz
tar cmake-3.12.3
cd cmake-3.12.3
./bootstrap --prefix=/usr/local
make -j$(nproc)
make install
cmake --version
cd ..
cd ..
npm install