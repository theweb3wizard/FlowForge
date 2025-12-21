
import { HardhatUserConfig } from "hardhat/config";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    // The `hardhat` network is built-in.
    // We can override its settings here.
    hardhat: {
      chainId: 1337, // Set the chain ID for the local node
    },
    // We can also define other custom networks, but they are not needed for now.
    // localhost: {
    //   url: "http://127.0.0.1:8545",
    //   chainId: 1337,
    // }
  },
};

export default config;
