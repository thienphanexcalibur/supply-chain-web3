import React, { useState, useEffect, useRef, useCallback } from "react";
import ItemManager from "./contracts/ItemManager.json";
import Item from "./contracts/Item.json";
import getWeb3 from "./getWeb3";

import "./App.css";

const App = () => {
  const [loaded, setLoaded] = useState(false);
  const [values, setValues] = useState({
    cost: 0,
    itemName: "example",
  });

  const [networkId, setNeworkId] = useState(null);

  const [contractAddress, setContractAddress] = useState(null);

  const [items, setItems] = useState([]);

  const web3 = useRef(null);

  const accounts = useRef(null);

  const itemManager = useRef(null);

  const item = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();

        web3.current = web3;

        // Use web3 to get the user's accounts.
        accounts.current = await web3.eth.getAccounts();

        // Get the network id
        const networkId = await web3.eth.net.getId();

        setNeworkId(networkId);

        // Get the contract instance.
        itemManager.current = new web3.eth.Contract(
          ItemManager.abi,
          ItemManager.networks[networkId] &&
            ItemManager.networks[networkId].address
        );

        setContractAddress(ItemManager.networks[networkId].address);

        item.current = new web3.eth.Contract(
          Item.abi,
          Item.networks[networkId] && Item.networks[networkId].address
        );

        console.log(
          "address item manager contract",
          ItemManager.networks[networkId].address
        );

        setLoaded(true);
      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`
        );
        console.error(error);
      }
    };
    init();
  }, []);

  const handleSubmit = async () => {
    const { cost, itemName } = values;
    const result = await itemManager.current.methods
      .createItem(itemName, cost)
      .send({ from: accounts.current[0] });
    alert(
      "Send " +
        cost +
        " Wei to " +
        result.events.SupplyChainStep.returnValues._address
    );
  };

  const handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getAllItems = async () => {
    const total = await itemManager.current.methods
      .getTotalItems()
      .call({ from: accounts.current[0] });

    setItems((prev) => []);

    for (let i = 0; i < total; i++) {
      itemManager.current.methods
        .items(i)
        .call({ from: accounts.current[0] })
        .then((res) => setItems((prev) => prev.concat(JSON.stringify(res))));
    }
  };

  const paymentsListener = () => {
    itemManager.current.events
      .SupplyChainStep()
      .on("data", async function (evt) {
        console.log(evt);
        if (evt.returnValues._step == 0) {
          getAllItems();
        }
        if (evt.returnValues._step == 1) {
          let item = await itemManager.current.methods
            .items(evt.returnValues._itemIndex)
            .call();
          console.log(item);
          alert("Item " + item._identifier + " was paid, deliver it now!");
        }
        console.log(evt);
      });
  };

  useEffect(() => {
    if (loaded) {
      getAllItems();
      paymentsListener();
    }
  }, [loaded]);

  if (!loaded) {
    return <div>Loading Web3, accounts, and contract...</div>;
  }
  return (
    <div className="App">
      <div style={{ textAlign: "center" }}>
        <p>
          Network ID: <b>{networkId}</b>
        </p>
        <p>
          Contract Address: <b>{contractAddress}</b>
        </p>
      </div>
      Cost:{" "}
      <input
        type="text"
        name="cost"
        value={values.cost}
        onChange={handleInputChange}
      />
      Item Name:{" "}
      <input
        type="text"
        name="itemName"
        value={values.itemName}
        onChange={handleInputChange}
      />
      <p>{items}</p>
      <button type="button" onClick={handleSubmit}>
        Create new Item
      </button>
    </div>
  );
};

export default App;
