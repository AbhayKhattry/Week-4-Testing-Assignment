const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const {ethers}=require('hardhat');

describe('Faucet', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    let withdrawAmount = ethers.utils.parseUnits("1", "ether");
    const provider =ethers.provider;
    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = await Faucet.deploy({value:withdrawAmount});

    const [owner,notOwner] = await ethers.getSigners();


    return { faucet, owner,notOwner, withdrawAmount,provider };
  }

  it('should deploy and set the owner correctly', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    expect(await faucet.owner()).to.equal(owner.address);
  });

  it('should not allow withdrawals above .1 ETH at a time', async function () {
    const { faucet, withdrawAmount } = await loadFixture(
      deployContractAndSetVariables
    );
    await expect(faucet.withdraw(withdrawAmount)).to.be.reverted;
  });

  it('does not allow non-owner to withdraw all funds',
  async function(){
    const {faucet,notOwner}=await loadFixture(deployContractAndSetVariables);
    const anocont=await faucet.connect(notOwner);
    await expect(anocont.withdrawAll()).to.be.reverted;
  });

  it('only owner can withdraw all funds',
  async function(){
    const {faucet,owner,withdrawAmount}=await loadFixture(deployContractAndSetVariables);
    await expect(await faucet.withdrawAll()).to.changeEtherBalance(owner,withdrawAmount);
  });

  it('does not allow non-owner to self-destroy',
  async function(){
    const {faucet,notOwner}=await loadFixture(deployContractAndSetVariables);
    const anocont=await faucet.connect(notOwner);
    await expect(anocont.destroyFaucet()).to.be.reverted;
  });

  it('only allows owner to self-destroy',
  async ()=>{
    const {faucet,provider}=await loadFixture(deployContractAndSetVariables);
    await faucet.destroyFaucet();
    await expect(await provider.getCode(faucet.address)).to.hexEqual('0x');
  });
});