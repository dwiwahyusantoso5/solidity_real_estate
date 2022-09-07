const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;
describe("RealEstate", () => {
  let realEstate, escrow, transaction;
  let accounts, deployer, seller, buyer, inspector, lender;
  let nftID = 1;
  let purchasePrice = ether(100);
  let escrowAmount = ether(20);

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    seller = deployer;
    buyer = accounts[1];
    inspector = accounts[2];
    lender = accounts[3];

    const RealEstate = await ethers.getContractFactory("RealEstate");
    const Escrow = await ethers.getContractFactory("Escrow");

    realEstate = await RealEstate.deploy();
    escrow = await Escrow.deploy(
      realEstate.address,
      nftID,
      purchasePrice,
      escrowAmount,
      seller.address,
      buyer.address,
      inspector.address,
      lender.address
    );

    transaction = await realEstate
      .connect(seller)
      .approve(escrow.address, nftID);
    await transaction.wait();
  });

  describe("Deployment", async () => {
    it("sends a NFT to the seller / deployer", async () => {
      expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);
    });
  });

  describe("Selling real estate", async () => {
    let transaction, balance;
    it("executes a successful transaction", async () => {
      expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);

      balance = await escrow.getBalance();
      console.log("Escrow balance: ", ethers.utils.formatEther(balance));

      transaction = await escrow
        .connect(buyer)
        .depositEarnest({ value: escrowAmount });
      console.log("Buyer deposit earnest money");

      balance = await escrow.getBalance();
      console.log("Escrow balance: ", ethers.utils.formatEther(balance));

      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(true);
      console.log("Inspector updates status");

      transaction = await escrow.connect(buyer).approveSale();
      console.log("Buyer approves sale");

      transaction = await escrow.connect(seller).approveSale();
      console.log("Seller approves sale");

      transaction = await lender.sendTransaction({
        to: escrow.address,
        value: ether(80),
      });

      transaction = await escrow.connect(lender).approveSale();
      console.log("Lender approves sale");

      transaction = await escrow.connect(buyer).finalizeSale();
      await transaction.wait();
      console.log("Buyer finalizes sale");

      expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address);

      balance = await ethers.provider.getBalance(seller.address);
      console.log("Seller balance:", ethers.utils.formatEther(balance));
      expect(balance).to.be.above(ether(10099));
    });
  });
});

//min 2.09
