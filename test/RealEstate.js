const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealEstate", () => {
  let realEstate, escrow, transaction;
  let accounts, deployer, seller, buyer;
  let nftID = 1;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    seller = deployer;
    buyer = accounts[1];

    const RealEstate = await ethers.getContractFactory("RealEstate");
    const Escrow = await ethers.getContractFactory("Escrow");

    realEstate = await RealEstate.deploy();
    escrow = await Escrow.deploy(
      realEstate.address,
      nftID,
      seller.address,
      buyer.address
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
    it("executes a successful transaction", async () => {
      expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);

      transaction = await escrow.connect(buyer).finalizeSale();
      await transaction.wait();
      console.log("Buyer finalizes sale");

      expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address);
    });
  });
});

//min 1.35
