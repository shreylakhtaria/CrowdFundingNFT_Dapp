import abi from "../../contracts/abi.js";
import bytecode from "../../contracts/bytecode.js";
import { ContractFactory } from "ethers";

async function contractDeployFcn(walletData) {
    console.log(`\n=======================================`);
    console.log(`- Deploying smart contract on Hedera...🟠`);

    // ETHERS PROVIDER AND SIGNER
    const provider = walletData[1];
    const signer = provider.getSigner();

    // DEPLOY SMART CONTRACT
    let contractAddress;
    try {
        const gasLimit = 4000000;

        const myContract = new ContractFactory(abi, bytecode, signer);
        console.log(`- ContractFactory created ✅`);

        const contractDeployTx = await myContract.deploy({ gasLimit: gasLimit });
        console.log(`- Contract deployment transaction sent ✅`);

        const contractDeployRx = await contractDeployTx.deployTransaction.wait();
        console.log(`- Contract deployment transaction mined ✅`);

        contractAddress = contractDeployRx.contractAddress;
        console.log(`- Contract deployed to address: \n${contractAddress} ✅`);
    } catch (deployError) {
        console.log(`- Deployment error: ${deployError.message.toString()}`);
    }
    return contractAddress;
}
export default contractDeployFcn;