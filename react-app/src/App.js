import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [isMining, setIsMining] = useState(false);
  const [totalWaves, setTotalWaves] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [waveMessage, setWaveMessage] = useState('');

  const contractAddress = "0x62BB73e0d3d2E04a97AcBB0CA1433584ffDBc3e7";
  const contractABI = abi.abi;

  async function getAllWaves() {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          };
        });
        setAllWaves(wavesCleaned);
        setTotalWaves(wavesCleaned.length);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, []);

  async function checkIfWalletIsConnected() {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      const count = await wavePortalContract.getTotalWaves();
      console.log(`Retrieved total wave count: ${count}`);
      setTotalWaves(count);

      await getAllWaves();

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function connectWallet() {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  async function wave(e) {
    e.preventDefault();

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waveTxn = await wavePortalContract.wave(waveMessage, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);
        setIsMining(true);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setIsMining(false);

        const count = await wavePortalContract.getTotalWaves();
        console.log(`Retrieved total wave count: ${count}`);
        setTotalWaves(count);
        setWaveMessage('');
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  function showConnectButton() {
    if (!currentAccount) {
      return (<button className="waveButton" onClick={connectWallet}>
        Connect Wallet
      </button>)
    }
  }
  function showWaveButton() {
    if (!isMining) {
      return (<form className="bio" onSubmit={wave}>
        <input type="text" placeholder="Enter a message!" value={waveMessage} onChange={e => setWaveMessage(e.target.value)} />
        <br />
        <button type="submit" className="waveButton">Wave at Me</button>
      </form>)
    } else if (isMining) {
      return (<button className="waveButton disabled" onClick={null}>
        Waiting for transaction to be mined...
      </button>)
    }
  }

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          I am Marvin and I'm new to crypto! Connect your Ethereum wallet and wave at me!
        </div>

        <div className="bio">
          {`I've received ${totalWaves} waves so far.`}
        </div>

        {showConnectButton()}
        {showWaveButton()}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
