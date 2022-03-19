import "./styles/App.css";

// フロントエンドとコントラクトを連携するライブラリをインポートします。
import { ethers } from "ethers";
// useEffect と useState 関数を React.js からインポートしています。
import React, { useEffect, useState } from "react";

import twitterLogo from "./assets/twitter-logo.svg";
import myEpicNft from "./utils/MyEpicNFT.json";
//import { totalmem } from "os";

const TWITTER_HANDLE = "monburanumee";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// コトントラクトアドレスをCONTRACT_ADDRESS変数に格納
const CONTRACT_ADDRESS = "0x3B96e554a5De2770B12D933adD6994ea63B88aE8";


const App = () => {
  // ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
  const [currentAccount, setCurrentAccount] = useState("");//アカウントを取得して表示を切り替える
  const [mintAmount, setmintAmount] = useState();//コントラクトからmint数を取得して表示する用
  const [minting, flg] = useState(false);//mint中は”minting”と表示して赤くする用

  // setupEventListener 関数を定義します。
  // MyEpicNFT.sol の中で event が　emit された時に、
  // 情報を受け取ります。
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        // Event が　emit される際に、コントラクトから送信される情報を受け取っています。
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          const urlJump = window.confirm(
            `あなたのウォレットに NFT を送信しました。\nOpenSea に反映されるまで10分程かかることがあります。\n\nOpenSea を開きますか？\nhttps://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
          if(urlJump){window.open(`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`, '_blank');} 
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ユーザーが認証可能なウォレットアドレスを持っているか確認します。
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // ユーザーが認証可能なウォレットアドレスを持っている場合は、ユーザーに対してウォレットへのアクセス許可を求める。許可されれば、ユーザーの最初のウォレットアドレスを accounts に格納する。
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      
      // イベントリスナーを設定
      // この時点で、ユーザーはウォレット接続が済んでいます。
       setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  // mint数カウント
  const mintCount = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          provider
        );
        var Count = await connectedContract.mintCount();
        setmintAmount(Count)

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 間違ったネットワーク上にいるときアラートを出す
  const ChainCheck = async () => {
    const { ethereum } = window;
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain " + chainId);
    const rinkebyChainId = "0x4"; //0x4はRinkebyのID
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the Rinkeby Test Network!");
    }
  }

  // connectWallet メソッドを実装します。
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      ChainCheck();

      // ウォレットアドレスに対してアクセスをリクエストしています。
      const accounts = await ethereum.request({
        method: "eth_requestAccounts"
      });

      console.log("Connected", accounts[0]);

      // ウォレットアドレスを currentAccount に紐付けます。
      setCurrentAccount(accounts[0]);

      // イベントリスナーを設定
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // NFT を Mint する関数を定義しています。
  const askContractToMintNft = async () => {
    if(mintAmount === 10){
      alert("終了しました！！！すいません！！！");
    }
    try {
      const { ethereum } = window;

      ChainCheck();

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        
        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        flg(true);
        console.log("Mining...please wait.");
        await nftTxn.wait();
        flg(false);

        await mintCount();
        //setupEventListener();

        console.log(nftTxn);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );

      } else {
        console.log("Ethereum object doesn't exist!");
      }

    } catch (error) {
      console.log(error);
    }
  };

  // ページがロードされた際に下記が実行されます。
  useEffect(() => {
    mintCount();
    checkIfWalletIsConnected();
  }, []);

  // renderNotConnectedContainer メソッド（ Connect to Wallet を表示する関数）を定義します。
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  // Mint NFT ボタンをレンダリングするメソッドを定義します。
  const renderMintUI = () => (
    <button onClick={askContractToMintNft} className={(minting===false?"cta-button connect-wallet-button":"cta-button2 connect-wallet-button")}>
      {minting === false
      ? "Mint NFT"
      : "Minting..."}
    </button>
  );

  const linkClick = () => (
    <>
      <button onClick={linkRarible} className="cta-button3 connect-wallet-button">
      Raribleで確認
      </button>
      <span>　　</span>
      <button onClick={linkOpensea} className="cta-button4 connect-wallet-button">
      Openseaで確認
      </button>
    </>
  );

  const linkRarible = () => (
    window.open(`https://rinkeby.rarible.com/user/${currentAccount}/owned`)
  );

  const linkOpensea = () => (
    window.open(`https://testnets.opensea.io/account`)
  );

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">Kurimanjuu NFT</p>
          <p className="sub-text">簡単な計算をNFTにしました!　計算が合えばレア💫です!（例：1+1=2）</p>
          {/*条件付きレンダリング。
          // すでにウォレット接続されている場合は、
          // Mint NFT を表示する。*/}
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : renderMintUI()}
          <p className="mint-count">mintされた数: {mintAmount}個 (10個まで)</p>
          {mintAmount === 10
            ? <p className="mint-count">終了しました！！！すいません！！！</p>
            : []}
          <br></br>
          {currentAccount === ""
            ? []
            : linkClick()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;