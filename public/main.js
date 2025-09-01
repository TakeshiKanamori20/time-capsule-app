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
  const address = await signer.getAddress();
  document.getElementById("metamaskStatus").textContent = `MetaMask接続済み: ${address}`;
  } catch (err) {
    statusDiv.textContent = "MetaMask接続に失敗しました: " + (err.message || err);
  }
};


form.onsubmit = async (e) => {
  e.preventDefault();
  statusDiv.textContent = "送信中...";
  if (!contract) {
    statusDiv.textContent = "MetaMask接続後に送信してください";
    submitBtn.disabled = false;
    return;
  }
  try {
    const email = document.getElementById("email").value;
    const plaintext = document.getElementById("plaintext").value;
    // Supabase保存API呼び出し関数
    async function saveCapsuleToSupabase(capsule) {
      try {
        const response = await fetch('/api/saveCapsule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(capsule),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '保存失敗');
        return result;
      } catch (e) {
        console.error('Supabase保存エラー:', e);
        return null;
      }
    }
    const monthsVal = document.getElementById("months").value;
    const daysVal = document.getElementById("days").value;
    const minutesVal = document.getElementById("minutes").value;
    const months = Number(monthsVal);
    const days = Number(daysVal);
    const minutes = Number(minutesVal);
    // 整数バリデーションと下限チェック
    if (!Number.isInteger(months) || !Number.isInteger(days) || !Number.isInteger(minutes) || months < 0 || days < 0 || minutes < 0) {
      statusDiv.textContent = "開封までの期間は整数のみ指定してください";
      submitBtn.disabled = false;
      return;
    }
    const totalMinutes = months * 30 * 24 * 60 + days * 24 * 60 + minutes;
    if (totalMinutes < 1) {
      statusDiv.textContent = "開封までの期間は1分以上にしてください";
      submitBtn.disabled = false;
      return;
    }
  // 月・日・分を秒換算
  const unlockAt = Math.floor(Date.now() / 1000) + totalMinutes * 60;
    // 月・日・分を秒換算
    const password = document.getElementById("password").value;
    // 月＋日を秒換算
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
      // 例: カプセル作成時にSupabaseへ保存
      const capsule = {
        id: capsuleId,
        email: email,
        unlock_time: unlockAt,
        encrypted_msg: encrypted,
        txUrl: txUrl || "N/A" // txUrlが無い場合はダミー値
      };
      const result = await saveCapsuleToSupabase(capsule);
      if (!result || result.error) {
        statusDiv.textContent = `カプセル保存に失敗しました: ${result && result.error ? result.error : 'ネットワークや入力内容をご確認ください。'}`;
        submitBtn.disabled = false;
        return;
      }
    statusDiv.textContent = "刻印しました。メールをご確認ください";
    const txUrl = explorerUrls[chain] + tx.hash;
    txLinkDiv.innerHTML = `<a href="${txUrl}" target="_blank">取引を見る</a>`;
    // メール送信（serial_idを渡す）
    await fetch("/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, encrypted, unlockAt, txUrl, serialId: result.serial_id }) // ←serial_idを渡す
    });
    // 完了メッセージ表示（SPA画面切り替えは行わない）
    if (window.showCompletionMessage) window.showCompletionMessage();
  } catch (err) {
    statusDiv.textContent = "エラー: " + (err.message || err);
  }
  submitBtn.disabled = false;
};

  // カプセル復号処理
  document.getElementById("getBtn").onclick = async function() {
    const serialId = document.getElementById("capsuleId").value; // serial_idとして取得
    const password = document.getElementById("unlockPassword").value;
    const getResult = document.getElementById("getResult");
    getResult.textContent = "取得中...";
    if (!serialId || !password) {
      getResult.textContent = "IDとパスワードを入力してください";
      return;
    }
    try {
      // Supabaseからカプセル取得（serial_idで検索）
      const response = await fetch('/api/getCapsule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialId, password })
      });
      const result = await response.json();
      if (!response.ok || !result || !result.encrypted_msg) {
        getResult.textContent = result.error || "カプセルが見つかりません";
        return;
      }
      // 復号
      let decrypted = "";
      try {
        const bytes = CryptoJS.AES.decrypt(result.encrypted_msg, password);
        decrypted = bytes.toString(CryptoJS.enc.Utf8);
      } catch (e) {
        decrypted = "復号に失敗しました";
      }
      getResult.textContent = decrypted ? `復元メッセージ: ${decrypted}` : "パスワードが違うか、復号できません";
    } catch (err) {
      getResult.textContent = "エラー: " + (err.message || err);
    }
  };
