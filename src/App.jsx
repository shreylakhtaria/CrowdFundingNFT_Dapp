import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MyGroup from "./components/MyGroup.jsx";
import walletConnectFcn from "./components/hedera/walletConnect.js";
import contractDeployFcn from "./components/hedera/contractDeploy.js";
import "./styles/App.css";
import { ethers } from "ethers";
import abi from "./contracts/abi.js";

function App() {
    const [walletData, setWalletData] = useState();
    const [account, setAccount] = useState();
    const [network, setNetwork] = useState();
    const [contractAddress, setContractAddress] = useState();

    const [connectTextSt, setConnectTextSt] = useState("🔌 Connect here...");
    const [contractTextSt, setContractTextSt] = useState();
    const [executeTextSt, setExecuteTextSt] = useState();

    const [connectLinkSt, setConnectLinkSt] = useState("");
    const [contractLinkSt, setContractLinkSt] = useState();
    const [executeLinkSt, setExecuteLinkSt] = useState();

    const navigate = useNavigate();

    async function connectWallet() {
        if (account !== undefined) {
            setConnectTextSt(`🔌 Account ${account} already connected ⚡ ✅`);
        } else {
            const wData = await walletConnectFcn();

            let newAccount = wData[0];
            let newNetwork = wData[2];
            if (newAccount !== undefined) {
                setConnectTextSt(`🔌 Account ${newAccount} connected ⚡ ✅`);
                setConnectLinkSt(`https://hashscan.io/${newNetwork}/account/${newAccount}`);

                setWalletData(wData);
                setAccount(newAccount);
                setNetwork(newNetwork);
                setContractTextSt();
            }
        }
    }

    async function contractDeploy() {
        if (account === undefined) {
            setContractTextSt("🛑 Connect a wallet first! 🛑");
        } else {
            console.log("Deploying contract...");
            const cAddress = await contractDeployFcn(walletData);

            if (cAddress === undefined) {
                setContractTextSt("🛑 Contract deployment failed! 🛑");
            } else {
                setContractAddress(cAddress);
                setContractTextSt(`Contract ${cAddress} deployed ✅`);
                setExecuteTextSt(``);
                setContractLinkSt(`https://hashscan.io/${network}/address/${cAddress}`);
            }
        }
    }

    async function createCampaign(name, description, goal, durationInDays) {
        if (contractAddress === undefined) {
            setExecuteTextSt("🛑 Deploy a contract first! 🛑");
        } else {
            const provider = walletData[1];
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi, signer);

            try {
                const tx = await contract.createCampaign(name, description, goal, durationInDays);
                await tx.wait();
                setExecuteTextSt(`Campaign created successfully ✅`);
                navigate(`/campaign/${tx.hash}`);
            } catch (error) {
                console.error(error);
                setExecuteTextSt(`Failed to create campaign 🛑`);
            }
        }
    }

    async function fundCampaign(campaignId, tierIndex, amount) {
        if (contractAddress === undefined) {
            setExecuteTextSt("🛑 Deploy a contract first! 🛑");
        } else {
            const provider = walletData[1];
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi, signer);

            try {
                const tx = await contract.fund(campaignId, tierIndex, { value: ethers.utils.parseEther(amount) });
                await tx.wait();
                setExecuteTextSt(`Campaign funded successfully ✅`);
            } catch (error) {
                console.error(error);
                setExecuteTextSt(`Failed to fund campaign 🛑`);
            }
        }
    }

    async function addTier(campaignId, name, amount) {
        if (contractAddress === undefined) {
            setExecuteTextSt("🛑 Deploy a contract first! 🛑");
        } else {
            const provider = walletData[1];
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi, signer);

            try {
                const tx = await contract.addTier(campaignId, name, ethers.utils.parseEther(amount));
                await tx.wait();
                setExecuteTextSt(`Tier added successfully ✅`);
            } catch (error) {
                console.error(error);
                setExecuteTextSt(`Failed to add tier 🛑`);
            }
        }
    }

    return (
        <div className="App">
            <h1 className="header">Let's Bulid a crowdfunding dapp with MetaMask and Hedera!</h1>
            <MyGroup fcn={connectWallet} buttonLabel={"Connect Wallet"} text={connectTextSt} link={connectLinkSt} />

            <MyGroup fcn={contractDeploy} buttonLabel={"Deploy Contract"} text={contractTextSt} link={contractLinkSt} />

            <MyGroup fcn={() => createCampaign("Campaign 1", "Description 1", 10, 30)} buttonLabel={"Create Campaign"} text={executeTextSt} link={executeLinkSt} />

            <MyGroup fcn={() => fundCampaign(0, 0, "1")} buttonLabel={"Fund Campaign"} text={executeTextSt} link={executeLinkSt} />

            <MyGroup fcn={() => addTier(0, "Tier 1", "1")} buttonLabel={"Add Tier"} text={executeTextSt} link={executeLinkSt} />

            <div className="logo">
                <div className="symbol">
                    <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                        <path d="M20 0a20 20 0 1 0 20 20A20 20 0 0 0 20 0" className="circle"></path>
                        <path d="M28.13 28.65h-2.54v-5.4H14.41v5.4h-2.54V11.14h2.54v5.27h11.18v-5.27h2.54zm-13.6-7.42h11.18v-2.79H14.53z" className="h"></path>
                    </svg>
                </div>
                <span>Hedera</span>
            </div>
        </div>
    );
}
export default App;