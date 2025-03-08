// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CrowdfundingHedera {
    struct Campaign {
        string name;
        string description;
        uint256 goal;
        uint256 deadline;
        address owner;
        bool paused;
        CampaignState state;
        Tier[] tiers;
        mapping(address => Backer) backers;
    }

    struct Tier {
        string name;
        uint256 amount;
        uint256 backers;
    }

    struct Backer {
        uint256 totalContribution;
        mapping(uint256 => bool) fundedTiers;
    }

    enum CampaignState { Active, Successful, Failed }

    address public factoryOwner;
    bool public factoryPaused;
    Campaign[] private campaigns;
    mapping(address => uint256[]) public userCampaigns;

    modifier onlyOwner(uint256 _campaignId) {
        require(msg.sender == campaigns[_campaignId].owner, "Not the owner");
        _;
    }

    modifier campaignOpen(uint256 _campaignId) {
        require(campaigns[_campaignId].state == CampaignState.Active, "Campaign is not active.");
        _;
    }

    modifier notPaused(uint256 _campaignId) {
        require(!campaigns[_campaignId].paused, "Contract is paused.");
        _;
    }

    modifier onlyFactoryOwner() {
        require(msg.sender == factoryOwner, "Not owner.");
        _;
    }

    modifier factoryNotPaused() {
        require(!factoryPaused, "Factory is paused");
        _;
    }

    constructor() {
        factoryOwner = msg.sender;
    }

    function createCampaign(
        string memory _name,
        string memory _description,
        uint256 _goal,
        uint256 _durationInDays
    ) external factoryNotPaused {
        Campaign storage newCampaign = campaigns.push();
        newCampaign.name = _name;
        newCampaign.description = _description;
        newCampaign.goal = _goal;
        newCampaign.deadline = block.timestamp + (_durationInDays * 1 days);
        newCampaign.owner = msg.sender;
        newCampaign.state = CampaignState.Active;

        userCampaigns[msg.sender].push(campaigns.length - 1);
    }

    function checkAndUpdateCampaignState(uint256 _campaignId) internal {
        Campaign storage campaign = campaigns[_campaignId];
        if (campaign.state == CampaignState.Active) {
            if (block.timestamp >= campaign.deadline) {
                campaign.state = address(this).balance >= campaign.goal ? CampaignState.Successful : CampaignState.Failed;
            } else {
                campaign.state = address(this).balance >= campaign.goal ? CampaignState.Successful : CampaignState.Active;
            }
        }
    }

    function fund(uint256 _campaignId, uint256 _tierIndex) public payable campaignOpen(_campaignId) notPaused(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(_tierIndex < campaign.tiers.length, "Invalid tier.");
        require(msg.value == campaign.tiers[_tierIndex].amount, "Incorrect amount.");

        campaign.tiers[_tierIndex].backers++;
        campaign.backers[msg.sender].totalContribution += msg.value;
        campaign.backers[msg.sender].fundedTiers[_tierIndex] = true;

        checkAndUpdateCampaignState(_campaignId);
    }

    function addTier(uint256 _campaignId, string memory _name, uint256 _amount) public onlyOwner(_campaignId) {
        require(_amount > 0, "Amount must be greater than 0.");
        campaigns[_campaignId].tiers.push(Tier(_name, _amount, 0));
    }

    function removeTier(uint256 _campaignId, uint256 _index) public onlyOwner(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(_index < campaign.tiers.length, "Tier does not exist.");
        campaign.tiers[_index] = campaign.tiers[campaign.tiers.length - 1];
        campaign.tiers.pop();
    }

    function withdraw(uint256 _campaignId) public onlyOwner(_campaignId) {
        checkAndUpdateCampaignState(_campaignId);
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.state == CampaignState.Successful, "Campaign not successful.");

        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        payable(campaign.owner).transfer(balance);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function refund(uint256 _campaignId) public {
        checkAndUpdateCampaignState(_campaignId);
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.state == CampaignState.Failed, "Refunds not available.");
        uint256 amount = campaign.backers[msg.sender].totalContribution;
        require(amount > 0, "No contribution to refund");

        campaign.backers[msg.sender].totalContribution = 0;
        payable(msg.sender).transfer(amount);
    }

    function hasFundedTier(uint256 _campaignId, address _backer, uint256 _tierIndex) public view returns (bool) {
        return campaigns[_campaignId].backers[_backer].fundedTiers[_tierIndex];
    }

    function getCampaignTiers(uint256 _campaignId) public view returns (Tier[] memory) {
        return campaigns[_campaignId].tiers;
    }

    function togglePause(uint256 _campaignId) public onlyOwner(_campaignId) {
        campaigns[_campaignId].paused = !campaigns[_campaignId].paused;
    }

    function getCampaignStatus(uint256 _campaignId) public view returns (CampaignState) {
        Campaign storage campaign = campaigns[_campaignId];
        if (campaign.state == CampaignState.Active && block.timestamp > campaign.deadline) {
            return address(this).balance >= campaign.goal ? CampaignState.Successful : CampaignState.Failed;
        }
        return campaign.state;
    }

    function extendDeadline(uint256 _campaignId, uint256 _daysToAdd) public onlyOwner(_campaignId) campaignOpen(_campaignId) {
        campaigns[_campaignId].deadline += _daysToAdd * 1 days;
    }

    function getUserCampaigns(address _user) external view returns (uint256[] memory) {
        return userCampaigns[_user];
    }

    // Instead of returning the entire Campaign struct, return a list of basic campaign details.
    function getAllCampaigns() external view returns (string[] memory, string[] memory, uint256[] memory, uint256[] memory, address[] memory) {
        uint256 len = campaigns.length;
        string[] memory names = new string[](len);
        string[] memory descriptions = new string[](len);
        uint256[] memory goals = new uint256[](len);
        uint256[] memory deadlines = new uint256[](len);
        address[] memory owners = new address[](len);

        for (uint256 i = 0; i < len; i++) {
            Campaign storage campaign = campaigns[i];
            names[i] = campaign.name;
            descriptions[i] = campaign.description;
            goals[i] = campaign.goal;
            deadlines[i] = campaign.deadline;
            owners[i] = campaign.owner;
        }

        return (names, descriptions, goals, deadlines, owners);
    }

    function toggleFactoryPause() external onlyFactoryOwner {
        factoryPaused = !factoryPaused;
    }
}