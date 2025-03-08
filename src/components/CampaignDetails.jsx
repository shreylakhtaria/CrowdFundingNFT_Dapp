import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import abi from "../contracts/abi.js";

function CampaignDetails({ walletData, contractAddress }) {
    const { campaignId } = useParams();
    const [campaign, setCampaign] = useState(null);
    const [fundAmount, setFundAmount] = useState("");

    useEffect(() => {
        async function fetchCampaignDetails() {
            if (contractAddress) {
                const provider = walletData[1];
                const contract = new ethers.Contract(contractAddress, abi, provider);
                const campaignDetails = await contract.getCampaignTiers(campaignId);
                setCampaign(campaignDetails);
            }
        }
        fetchCampaignDetails();
    }, [contractAddress, campaignId, walletData]);

    async function fundCampaign() {
        if (contractAddress && fundAmount) {
            const provider = walletData[1];
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi, signer);

            try {
                const tx = await contract.fund(campaignId, 0, { value: ethers.utils.parseEther(fundAmount) });
                await tx.wait();
                alert("Campaign funded successfully ✅");
            } catch (error) {
                console.error(error);
                alert("Failed to fund campaign 🛑");
            }
        }
    }

    if (!campaign) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>Campaign Details</h2>
            <p>Name: {campaign.name}</p>
            <p>Description: {campaign.description}</p>
            <p>Goal: {campaign.goal}</p>
            <p>Deadline: {new Date(campaign.deadline * 1000).toLocaleString()}</p>
            <p>Owner: {campaign.owner}</p>
            <p>State: {campaign.state}</p>
            <h3>Fund Campaign</h3>
            <input
                type="text"
                placeholder="Amount in ETH"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
            />
            <button onClick={fundCampaign}>Fund</button>
        </div>
    );
}

export default CampaignDetails;