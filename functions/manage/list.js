<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<title>文件管理 - Telegraph Image</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
  background: #f7f7f7;
  margin: 0;
  padding: 20px;
  color: #333;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 15px;
}

.card {
  background: #fff;
  padding: 18px;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.08);
  margin-bottom: 25px;
}

.button {
  background: #4a77ff;
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  border: none;
}

.button:hover { background: #3a63d8; }

.file-list {
  margin-top: 15px;
}

.item {
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
}

.small {
  font-size: 13px;
  color: #777;
}

.tag {
  display: inline-block;
  background: #eef1ff;
  padding: 3px 8px;
  font-size: 12px;
  border-radius: 6px;
  margin-right: 6px;
  color: #4a55aa;
}
</style>
</head>

<body>

<h1>📂 文件管理后台</h1>

<div class="card">
  <h2>上传文件</h2>
  <button class="button" id="uploadBtn">选择文件上传</button>

  <!-- 隐藏的 input（支持多文件） -->
  <input type="file" id="fileInput" name="file" multiple style="display:none" />

  <div style="margin-top: 8px;">
    <input id="tagInput" placeholder="标签（可选，用逗号分隔）" 
           style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc;">
  </div>
</div>

<div class="card">
  <h2>文件列表</h2>
  <input id="search" placeholder="搜索文件名或标签…" 
         style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;">
  
  <div id="list" class="file-list"></div>
</div>

<script>

// ===== 按钮点击 → 打开文件选择 =====
document.getElementById("uploadBtn").onclick = () => {
  document.getElementById("fileInput").click();
};

// ===== 选择文件后自动上传 =====
document.getElementById("fileInput").onchange = async (e) => {
  const files = e.target.files;
  if (!files.length) return;

  const tags = document.getElementById("tagInput").value;

  const form = new FormData();
  for (const f of files) form.append("file", f);
  form.append("tags", tags);

  const resp = await fetch("/upload", {
    method: "POST",
    body: form
  });

  const data = await resp.json();
  if (!data.ok) {
    alert("上传失败：" + JSON.stringify(data));
    return;
  }

  alert("上传成功，共上传 " + data.files.length + " 个文件");
  loadList();
};

// ===== 加载文件列表 =====
async function loadList() {
  const res = await fetch("/manage/list");
  const data = await res.json();

  const list = document.getElementById("list");
  list.innerHTML = "";

  for (const item of data.items) {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <strong>${item.name}</strong>
      <a href="${item.url}" target="_blank">${item.url}</a>
      <div class="small">${new Date(item.time).toLocaleString()}</div>
      <div>${item.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
    `;

    list.appendChild(div);
  }
}

// ===== 搜索功能 =====
document.getElementById("search").oninput = () => {
  const keyword = document.getElementById("search").value.trim().toLowerCase();
  const items = document.querySelectorAll(".item");

  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    item.style.display = text.includes(keyword) ? "block" : "none";
  });
};

// 页面加载时刷新列表
loadList();

</script>
</body>
</html>
