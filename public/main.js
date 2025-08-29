const contractAddress = "0x7c6cb4b75fa468118cc6626484cde800dfcab6eb";
const chain = "amoy";
const explorerUrls = {
  amoy: "https://www.oklink.com/amoy/tx/",
  sepolia: "https://sepolia.etherscan.io/tx/",
  mumbai: "https://mumbai.polygonscan.com/tx/"
};
const abi = [
  "function save(string encrypted, uint256 unlockTime) returns (uint256)",
  "function get(uint256 id) view returns (address,uint256,string)",
  "event Saved(address indexed owner, uint256 id, uint256 unlockTime, string encrypted)"
];


let provider, signer, contract;
const connectBtn = document.getElementById("connectBtn");
const form = document.getElementById("capsuleForm");
const statusDiv = document.getElementById("status");
const txLinkDiv = document.getElementById("txLink");
const submitBtn = document.getElementById("submitBtn");

connectBtn.onclick = async () => {
  try {
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      statusDiv.textContent = "MetaMaskをインストールしてください";
      return;
    }
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    // Amoy専用ネットワークチェック
    const network = await provider.getNetwork();
    if (network.chainId !== 80002) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13882" }]
        });
      } catch (e) {
        statusDiv.textContent = "ネットワーク切替に失敗しました。MetaMaskでAmoyネットワークを追加してください。";
        return;
      }
      // 再取得
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = await provider.getSigner();
    }
    contract = new ethers.Contract(contractAddress, abi, signer);
    statusDiv.textContent = "MetaMask接続済み";
  } catch (err) {
    statusDiv.textContent = "MetaMask接続に失敗しました: " + (err.message || err);
  }
};


form.onsubmit = async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  statusDiv.textContent = "送信中...";
  txLinkDiv.textContent = "";
  document.getElementById("capsuleIdNotice").textContent = "";
  if (!contract) {
    statusDiv.textContent = "MetaMask接続後に送信してください";
    submitBtn.disabled = false;
    return;
  }
  try {
    const email = document.getElementById("email").value;
    const plaintext = document.getElementById("plaintext").value;
    const monthsVal = document.getElementById("months").value;
    const daysVal = document.getElementById("days").value;
    const months = Number(monthsVal);
    const days = Number(daysVal);
          // 整数バリデーションとゼロチェック
          if (!Number.isInteger(months) || !Number.isInteger(days) || months < 0 || days < 0) {
            statusDiv.textContent = "開封までの期間は整数のみ指定してください";
            submitBtn.disabled = false;
            return;
          }
          if (months === 0 && days === 0) {
            statusDiv.textContent = "開封までの期間は1日以上にしてください";
            submitBtn.disabled = false;
            return;
          }
    const password = document.getElementById("password").value;
    // 月＋日を秒換算
    const unlockAt = Math.floor(Date.now() / 1000) + ((months * 30 + days) * 24 * 60 * 60);
    if (!password) {
      statusDiv.textContent = "パスワードを入力してください";
      submitBtn.disabled = false;
      return;
    }
    const encrypted = CryptoJS.AES.encrypt(plaintext, password).toString();
    // コントラクト呼び出し（暗号化メッセージ保存）
    const tx = await contract.save(encrypted, unlockAt);
    const receipt = await tx.wait();
    // カプセルID取得（event or nextId-1）
    let capsuleId = null;
    if (receipt && receipt.events && receipt.events.length > 0) {
      const event = receipt.events.find(ev => ev.event === "Saved");
      if (event && event.args && event.args.id) capsuleId = event.args.id.toString();
    }
    // 画面表示
    if (capsuleId !== null) {
      document.getElementById("capsuleIdNotice").textContent = `カプセルID: ${capsuleId}（必ずメモしてください。メールでもお送りします）`;
    }
    statusDiv.textContent = "刻印しました。メールをご確認ください";
    const txUrl = explorerUrls[chain] + tx.hash;
    txLinkDiv.innerHTML = `<a href="${txUrl}" target="_blank">取引を見る</a>`;
    // メール送信（暗号化メッセージ送信＋カプセルID送信）
    await fetch("/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, encrypted, unlockAt, txUrl, capsuleId })
    });
  } catch (err) {
    statusDiv.textContent = "エラー: " + (err.message || err);
  }
  submitBtn.disabled = false;
};
