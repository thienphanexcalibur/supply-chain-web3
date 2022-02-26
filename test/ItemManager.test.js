const ItemManager = artifacts.require("./ItemManager.sol");

contract("ItemManager", (accounts) => {
  it("... should let you create new Items.", async () => {
    const itemManagerInstance = await ItemManager.deployed();
    const itemName = "test1";
    const itemPrice = 500;

    const result = await itemManagerInstance.createItem(itemName, itemPrice, {
      from: accounts[0],
    });
    assert.equal(
      result.logs[0].args._itemIndex,
      0,
      "There should be one item index in there"
    );
    const item = await itemManagerInstance.items(0);
    assert.equal(
      item._identifier,
      itemName,
      "The item has a different identifier"
    );
  });

  it("...should let you pay for an item", async () => {
    const itemManagerInstance = await ItemManager.deployed();
    const item = await itemManagerInstance.items(0);

    await web3.eth.sendTransaction({
      from: accounts[1],
      to: item._item,
      value: 500,
    });
    const paidItem = await itemManagerInstance.items(0);
    assert.equal(paidItem._step, 1, "Item is paid");
  });
});
