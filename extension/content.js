if (window.location.href.includes("localhost:5173") || window.location.href.includes("127.0.0.1:5173")) {
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || !event.data.type) return;

    if (event.data.type === "STUDYOS_FOCUS_UPDATE") {
      chrome.runtime.sendMessage({ 
        type: "SET_FOCUS_STATE", 
        active: event.data.active 
      });
    }
  });
} else {
  chrome.runtime.sendMessage({ type: "CHECK_BLOCK", url: window.location.href }, (response) => {
    if (response && response.shouldBlock) {
      document.body.innerHTML = "<div style='display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#f8fafc;font-family:sans-serif;text-align:center;padding:2rem;'><h1 style='font-size:3rem;margin-bottom:1rem;'>Blocked by StudyOS ???</h1><p style='font-size:1.5rem;color:#94a3b8;'>You are currently in a Focus Session. Get back to work!</p></div>";
      document.body.style.margin = "0";
      document.title = "Blocked - Focus Mode";
    }
  });
}
