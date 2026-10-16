
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

/* ==============================
   Firebase
============================== */

const firebaseConfig = {
    apiKey: "AIzaSyAaNj6Znk30zLZM3QVvEEPdSnPFjJyr_LE",
    authDomain: "transfer-2b40c.firebaseapp.com",
    databaseURL:
        "https://transfer-2b40c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "transfer-2b40c",
    storageBucket: "transfer-2b40c.firebasestorage.app",
    messagingSenderId: "1041873060739",
    appId: "1:1041873060739:web:a61497c1cfe0854a8becb6"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

console.log("Firebase Realtime Database 連線完成！");

/* ==============================
   主程式
============================== */

document.addEventListener("DOMContentLoaded", function () {

    const descriptions = {
        success: "透過總成功率可以看到成功、失敗與總數",
        visual: "亮起第一顆燈後，使用者幾秒成功接上第一條線",
        memory: "聲音播放後，燈光提示出現幾次",
        hearing: "聲音播放後，使用者成功接上第二條線的平均時間",
        focus: "同時有1、2、3條線占整個遊戲時間的比例",
        analysis: "透過總分析可以對比全體遊玩資料"
    };

    let elderIds = [];
    let currentGroupPage = "success";
    let currentProfilePage = "success";
    let currentProfileElderId = null;

    // 避免快速切換日期時，舊資料覆蓋新資料
    let groupRequestVersion = 0;
    let profileRequestVersion = 0;

    /* ==============================
       取得 HTML 元素
    ============================== */

    const $ = (id) => document.getElementById(id);

    const categoryButtons =
        document.querySelectorAll(".category-button");

    const profileCategoryButtons =
        document.querySelectorAll(".profile-category-button");

    const pageDescription = $("pageDescription");
    const peopleGrid = $("peopleGrid");
    const groupSearchInput = $("groupSearchInput");

    const previousDateButton = $("previousDate");
    const nextDateButton = $("nextDate");
    const currentYearText = $("currentYear");
    const currentDateText = $("currentDate");

    const modeButton = $("modeButton");
    const modeButtonText = $("modeButtonText");
    const modeDropdown = $("modeDropdown");
    const modeOptions = modeDropdown.querySelectorAll("button");
    const modeSubtitle = $("modeSubtitle");

    const groupModeContent = $("groupModeContent");
    const singleModeContent = $("singleModeContent");

    const singleSearchPanel = $("singleSearchPanel");
    const singleSearchInput = $("singleSearchInput");
    const singleSearchButton = $("singleSearchButton");

    const singleAddPanel = $("singleAddPanel");
    const newElderInput = $("newElderInput");
    const addElderButton = $("addElderButton");
    const openAddElder = $("openAddElder");
    const backToSearch = $("backToSearch");

    const singleProfilePanel = $("singleProfilePanel");
    const backToSingleSearch = $("backToSingleSearch");
    const profilePageDescription = $("profilePageDescription");
    const profileContent = $("profileContent");

    const deleteElderButton = $("deleteElderButton");
    const deleteModal = $("deleteModal");
    const deleteModalText = $("deleteModalText");
    const confirmDeleteButton = $("confirmDeleteButton");
    const cancelDeleteButton = $("cancelDeleteButton");

    /* ==============================
       日期
    ============================== */

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let selectedDate = new Date(today);

    function getSelectedDateString() {
        const year = selectedDate.getFullYear();

        const month = String(
            selectedDate.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            selectedDate.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function updateDateDisplay() {
        currentYearText.textContent =
            selectedDate.getFullYear();

        currentDateText.textContent =
            `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`;

        const isToday =
            selectedDate.getTime() >= today.getTime();

        nextDateButton.disabled = isToday;
        nextDateButton.style.opacity = isToday ? "0.3" : "1";
        nextDateButton.style.cursor =
            isToday ? "default" : "pointer";

        if (!groupModeContent.classList.contains("hidden")) {
            updateAllElderCards();
        }

        if (!singleProfilePanel.classList.contains("hidden")) {
            updateProfileContent();
        }
    }

    previousDateButton.addEventListener("click", function () {
        selectedDate.setDate(selectedDate.getDate() - 1);
        updateDateDisplay();
    });

    nextDateButton.addEventListener("click", function () {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);

        if (next.getTime() > today.getTime()) {
            return;
        }

        selectedDate = next;
        updateDateDisplay();
    });

    /* ==============================
       Firebase 長輩編號
    ============================== */

    async function loadElderIdsFromFirebase() {
        try {
            const snapshot = await get(
                ref(database, "players")
            );

            if (!snapshot.exists()) {
                elderIds = [];
                return;
            }

            elderIds = Object.keys(snapshot.val()).sort(
                (a, b) => a.localeCompare(
                    b,
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                )
            );

        } catch (error) {
            console.error("讀取長輩編號失敗：", error);
            elderIds = [];
        }
    }

    /* ==============================
       全體模式卡片
    ============================== */

    function renderElderCards() {
        peopleGrid.innerHTML = "";

        elderIds.forEach(function (elderId) {
            const card = document.createElement("article");
            card.className = "person-card";
            card.dataset.elderId = elderId;

            const title = document.createElement("h2");
            title.textContent = elderId;

            const data = document.createElement("div");
            data.className = "person-data";
            data.id = "elderData_" + elderId;
            data.textContent = "資料讀取中...";

            card.appendChild(title);
            card.appendChild(data);
            peopleGrid.appendChild(card);
        });

        filterGroupCards();
        updateAllElderCards();
    }

    function filterGroupCards() {
        const keyword = groupSearchInput.value.trim();

        peopleGrid.querySelectorAll(".person-card")
            .forEach(function (card) {
                card.style.display =
                    !keyword ||
                    card.dataset.elderId.includes(keyword)
                        ? ""
                        : "none";
            });
    }

    groupSearchInput.addEventListener(
        "input",
        filterGroupCards
    );

    /* ==============================
       數字處理
    ============================== */

    function safeNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function safeCount(value) {
        return Math.max(0, safeNumber(value));
    }

    function normalizeNumberList(value) {
        if (!value) {
            return [];
        }

        if (Array.isArray(value)) {
            return value.filter(
                item => item !== null && item !== undefined
            );
        }

        if (typeof value === "object") {
            return Object.keys(value)
                .sort((a, b) => Number(a) - Number(b))
                .map(key => value[key]);
        }

        return [];
    }

    function getSuccessData(record) {
        const completed = safeCount(record.completedCalls);
        const failed = safeCount(record.failedCalls);
        const total = completed + failed;

        const rate = total > 0
            ? completed / total * 100
            : 0;

        return {
            completed,
            failed,
            total,
            rate
        };
    }

    function getRecordTime(record) {
        if (
            typeof record.playedAt === "string" &&
            record.playedAt.length >= 16
        ) {
            return record.playedAt.substring(11, 16);
        }

        return "--:--";
    }

    function formatTimeList(value) {
        const times = normalizeNumberList(value);

        if (times.length === 0) {
            return "無反應時間紀錄<br>";
        }

        return times.map((time, index) => {
            return `第${index + 1}通：
                    ${safeNumber(time).toFixed(2)} 秒<br>`;
        }).join("");
    }

    /* ==============================
       讀取每日每局資料
    ============================== */

    async function loadElderDailyRecords(
        elderId,
        dateString = getSelectedDateString()
    ) {
        try {
            const sessionsPath =
                `players/${elderId}/dates/${dateString}/sessions`;

            const snapshot = await get(
                ref(database, sessionsPath)
            );

            if (!snapshot.exists()) {
                return [];
            }

            const sessions = snapshot.val();

            const result = Object.entries(sessions)
                .filter(([, session]) =>
                    session && typeof session === "object"
                )
                .map(([sessionId, session]) => ({
                    ...session,
                    id: sessionId
                }));

            // 先按時間由舊到新排列
            result.sort((a, b) => {
                const timeA = String(a.playedAt ?? "");
                const timeB = String(b.playedAt ?? "");

                const comparison = timeA.localeCompare(timeB);

                if (comparison !== 0) {
                    return comparison;
                }

                return String(a.id).localeCompare(String(b.id));
            });

            return result;

        } catch (error) {
            console.error(
                `讀取編號 ${elderId} 的紀錄失敗：`,
                error
            );

            return [];
        }
    }

    /* ==============================
       全體模式：最新一筆
    ============================== */

    function createLatestRecordHtml(record, page) {
        const time = getRecordTime(record);

        if (page === "success") {
            const data = getSuccessData(record);

            return `
                <div class="record-detail">
                    最新紀錄：${time}
                    <br><br>
                    成功：${data.completed} 次<br>
                    失敗：${data.failed} 次<br>
                    總數：${data.total} 次<br>
                    成功率：${data.rate.toFixed(1)}%
                </div>
            `;
        }

        if (page === "visual") {
            return `
                <div class="record-detail">
                    最新紀錄：${time}
                    <br><br>
                    ${formatTimeList(record.visualTimes)}
                    <strong>
                        平均：
                        ${safeNumber(record.averageVisualTime).toFixed(2)}
                        秒
                    </strong>
                </div>
            `;
        }

        if (page === "memory") {
            return `
                <div class="record-detail">
                    最新紀錄：${time}
                    <br><br>
                    提示次數：
                    ${safeCount(record.hintCount)} 次
                </div>
            `;
        }

        if (page === "hearing") {
            return `
                <div class="record-detail">
                    最新紀錄：${time}
                    <br><br>
                    ${formatTimeList(record.hearingTimes)}
                    <strong>
                        平均：
                        ${safeNumber(record.averageHearingTime).toFixed(2)}
                        秒
                    </strong>
                </div>
            `;
        }

        const data = getSuccessData(record);

        return `
            <div class="record-detail">
                最新紀錄：${time}
                <br><br>
                成功率：${data.rate.toFixed(1)}%<br>
                平均視覺反應：
                ${safeNumber(record.averageVisualTime).toFixed(2)} 秒
                <br>
                提示次數：
                ${safeCount(record.hintCount)} 次
                <br>
                平均聽力反應：
                ${safeNumber(record.averageHearingTime).toFixed(2)} 秒
            </div>
        `;
    }

    async function updateAllElderCards() {
        const version = ++groupRequestVersion;
        const dateString = getSelectedDateString();
        const page = currentGroupPage;

        for (const elderId of elderIds) {
            if (version !== groupRequestVersion) {
                return;
            }

            const dataElement = $("elderData_" + elderId);

            if (!dataElement) {
                continue;
            }

            dataElement.textContent = "資料讀取中...";

            const records = await loadElderDailyRecords(
                elderId,
                dateString
            );

            if (version !== groupRequestVersion) {
                return;
            }

            if (!dataElement.isConnected) {
                continue;
            }

            if (records.length === 0) {
                dataElement.textContent = "當日無遊玩紀錄";
                continue;
            }

            const latest = records[records.length - 1];

            dataElement.innerHTML =
                createLatestRecordHtml(latest, page);
        }
    }

    /* ==============================
       全體模式頁籤
    ============================== */

    categoryButtons.forEach(function (button) {
        button.addEventListener("click", function () {

            categoryButtons.forEach(item =>
                item.classList.remove("active")
            );

            button.classList.add("active");

            currentGroupPage = button.dataset.page;

            pageDescription.textContent =
                descriptions[currentGroupPage];

            updateAllElderCards();
        });
    });

    /* ==============================
       模式切換
    ============================== */

    modeButton.addEventListener("click", function () {
        modeDropdown.classList.toggle("show");
    });

    modeOptions.forEach(function (option) {
        option.addEventListener("click", function () {
            const mode = option.dataset.mode;

            if (mode === "group") {
                document.body.classList.remove(
                    "single-mode-active"
                );

                modeButtonText.textContent = "全體模式";
                modeSubtitle.textContent = "當日遊玩數";

                groupModeContent.classList.remove("hidden");
                singleModeContent.classList.add("hidden");

                profileRequestVersion++;
                updateAllElderCards();

            } else {
                document.body.classList.add(
                    "single-mode-active"
                );

                modeButtonText.textContent = "單人模式";

                groupModeContent.classList.add("hidden");
                singleModeContent.classList.remove("hidden");

                groupRequestVersion++;
                showSearchPanel();
            }

            modeDropdown.classList.remove("show");
        });
    });

    document.addEventListener("click", function (event) {
        if (!event.target.closest(".mode-select")) {
            modeDropdown.classList.remove("show");
        }
    });

    /* ==============================
       單人模式：頁面切換
    ============================== */

    function showSearchPanel() {
        profileRequestVersion++;

        singleSearchPanel.classList.remove("hidden");
        singleAddPanel.classList.add("hidden");
        singleProfilePanel.classList.add("hidden");

        modeSubtitle.textContent = "請查詢長輩編號";
    }

    function showAddPanel() {
        profileRequestVersion++;

        singleSearchPanel.classList.add("hidden");
        singleAddPanel.classList.remove("hidden");
        singleProfilePanel.classList.add("hidden");

        modeSubtitle.textContent = "請新增長輩編號";
    }

    openAddElder.addEventListener("click", showAddPanel);
    backToSearch.addEventListener("click", showSearchPanel);
    backToSingleSearch.addEventListener(
        "click",
        showSearchPanel
    );

    /* ==============================
       新增長輩編號
    ============================== */

    async function addElder() {
        const elderId = newElderInput.value.trim();

        if (elderId === "") {
            alert("請輸入長輩編號");
            return;
        }

        if (!/^\d+$/.test(elderId)) {
            alert("長輩編號只能使用數字");
            return;
        }

        try {
            const elderReference = ref(
                database,
                "players/" + elderId
            );

            const snapshot = await get(elderReference);

            if (snapshot.exists()) {
                alert("這個長輩編號已經存在");
                return;
            }

            await set(elderReference, {
                exists: true
            });

            if (!elderIds.includes(elderId)) {
                elderIds.push(elderId);

                elderIds.sort((a, b) =>
                    a.localeCompare(
                        b,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    )
                );
            }

            renderElderCards();

            newElderInput.value = "";

            alert(`長輩編號 ${elderId} 新增成功`);

            showSearchPanel();

        } catch (error) {
            console.error("新增長輩編號失敗：", error);
            alert("新增失敗，請檢查 Firebase 連線或權限");
        }
    }

    addElderButton.addEventListener("click", addElder);

    newElderInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            addElder();
        }
    });

    /* ==============================
       查詢長輩編號
    ============================== */

    async function searchElder() {
        const elderId = singleSearchInput.value.trim();

        if (elderId === "") {
            alert("請輸入長輩編號");
            return;
        }

        if (!/^\d+$/.test(elderId)) {
            alert("長輩編號只能使用數字");
            return;
        }

        try {
            const snapshot = await get(
                ref(database, "players/" + elderId)
            );

            if (!snapshot.exists()) {
                alert("查無此長輩編號");
                return;
            }

            currentProfileElderId = elderId;
            showProfilePanel(elderId);

        } catch (error) {
            console.error("查詢長輩編號失敗：", error);
            alert("查詢失敗，請稍後再試");
        }
    }

    singleSearchButton.addEventListener(
        "click",
        searchElder
    );

    singleSearchInput.addEventListener(
        "keydown",
        function (event) {
            if (event.key === "Enter") {
                searchElder();
            }
        }
    );

    /* ==============================
       單人模式：個人資料頁
    ============================== */

    function showProfilePanel(elderId) {
        singleSearchPanel.classList.add("hidden");
        singleAddPanel.classList.add("hidden");
        singleProfilePanel.classList.remove("hidden");

        modeSubtitle.textContent = "編號 " + elderId;

        currentProfilePage = "success";

        profileCategoryButtons.forEach(function (button) {
            button.classList.toggle(
                "active",
                button.dataset.profilePage === "success"
            );
        });

        profilePageDescription.textContent =
            descriptions.success;

        updateProfileContent();
    }

    /* ==============================
       新增：單局總成功率環形圖
    ============================== */

    function createSuccessChartHtml(record) {
        const data = getSuccessData(record);
        const time = getRecordTime(record);

        // CSS conic-gradient 環形圖
        // 成功部分使用深紫灰色
        // 失敗部分使用淺紫灰色
        const rate = data.rate;

        const chartBackground = data.total > 0
            ? `conic-gradient(
                #686F98 0% ${rate}%,
                #C9CBD9 ${rate}% 100%
              )`
            : "#C9CBD9";

        return `
            <div class="record-detail">

                <div class="success-record-time">
                    遊玩時間：${time}
                </div>

                <div class="success-chart-layout">

                    <div
                        class="success-donut"
                        style="background: ${chartBackground};"
                        role="img"
                        aria-label="成功率 ${rate.toFixed(1)}%"
                    >
                        <div class="success-donut-center">

                            <div class="success-donut-rate">
                                ${rate.toFixed(1)}%
                            </div>

                            <div class="success-donut-label">
                                成功率
                            </div>

                        </div>
                    </div>

                    <div class="success-stat-list">

                        <div class="success-stat">
                            <span
                                class="success-stat-dot success-dot-completed"
                            ></span>

                            <span>成功次數</span>

                            <strong>
                                ${data.completed} 次
                            </strong>
                        </div>

                        <div class="success-stat">
                            <span
                                class="success-stat-dot success-dot-failed"
                            ></span>

                            <span>失敗次數</span>

                            <strong>
                                ${data.failed} 次
                            </strong>
                        </div>

                        <div class="success-stat success-stat-total">
                            <span>總次數</span>

                            <strong>
                                ${data.total} 次
                            </strong>
                        </div>

                    </div>

                </div>

            </div>
        `;
    }

    /* ==============================
       單人模式：其他頁籤文字
    ============================== */

    function createProfileRecordHtml(record, page) {
        const time = getRecordTime(record);

        // 只有總成功率改成圖表
        if (page === "success") {
            return createSuccessChartHtml(record);
        }

        if (page === "visual") {
            return `
                <div class="record-detail">
                    遊玩時間：${time}
                    <br><br>
                    ${formatTimeList(record.visualTimes)}
                    <strong>
                        平均：
                        ${safeNumber(record.averageVisualTime).toFixed(2)}
                        秒
                    </strong>
                </div>
            `;
        }

        if (page === "memory") {
            return `
                <div class="record-detail">
                    遊玩時間：${time}
                    <br><br>
                    提示次數：
                    ${safeCount(record.hintCount)} 次
                </div>
            `;
        }

        if (page === "hearing") {
            return `
                <div class="record-detail">
                    遊玩時間：${time}
                    <br><br>
                    ${formatTimeList(record.hearingTimes)}
                    <strong>
                        平均：
                        ${safeNumber(record.averageHearingTime).toFixed(2)}
                        秒
                    </strong>
                </div>
            `;
        }

        if (page === "focus") {
            const focus = record.focusPercentage || {};

            return `
                <div class="record-detail">
                    遊玩時間：${time}
                    <br><br>
                    1組線：
                    ${safeNumber(focus.oneLine).toFixed(1)}%
                    <br>
                    2組線：
                    ${safeNumber(focus.twoLines).toFixed(1)}%
                    <br>
                    3組線：
                    ${safeNumber(focus.threeLines).toFixed(1)}%
                </div>
            `;
        }

        // 總分析：暫時保留原本的每局摘要
        const data = getSuccessData(record);

        return `
            <div class="record-detail">
                遊玩時間：${time}
                <br><br>
                成功率：${data.rate.toFixed(1)}%
                <br>
                平均視覺反應：
                ${safeNumber(record.averageVisualTime).toFixed(2)} 秒
                <br>
                提示次數：
                ${safeCount(record.hintCount)} 次
                <br>
                平均聽力反應：
                ${safeNumber(record.averageHearingTime).toFixed(2)} 秒
            </div>
        `;
    }

    /* ==============================
       更新單人模式資料
    ============================== */

    async function updateProfileContent() {
        if (!currentProfileElderId) {
            return;
        }

        const version = ++profileRequestVersion;
        const elderId = currentProfileElderId;
        const dateString = getSelectedDateString();
        const page = currentProfilePage;

        profileContent.textContent = "資料讀取中...";

        const records = await loadElderDailyRecords(
            elderId,
            dateString
        );

        // 使用者已切換日期、頁籤或編號時
        // 不讓舊的讀取結果覆蓋新畫面
        if (
            version !== profileRequestVersion ||
            singleProfilePanel.classList.contains("hidden")
        ) {
            return;
        }

        if (records.length === 0) {
            profileContent.textContent = "當日無遊玩紀錄";
            return;
        }

        /*
           records 已依時間由舊到新排列。
           反轉顯示順序，讓最新一局在最上面。
           但局數仍依當天實際遊玩順序編號。
        */

        const numberedRecords = records.map(
            (record, index) => ({
                record,
                sessionNumber: index + 1
            })
        );

        numberedRecords.reverse();

        const html = numberedRecords.map(function (item) {
            return `
                <div class="profile-session-record">

                    <div class="profile-session-title">
                        第 ${item.sessionNumber} 局
                    </div>

                    ${createProfileRecordHtml(
                        item.record,
                        page
                    )}

                </div>
            `;
        }).join("");

        profileContent.innerHTML = html;
    }

    /* ==============================
       單人模式頁籤
    ============================== */

    profileCategoryButtons.forEach(function (button) {
        button.addEventListener("click", function () {

            profileCategoryButtons.forEach(item =>
                item.classList.remove("active")
            );

            button.classList.add("active");

            currentProfilePage =
                button.dataset.profilePage;

            profilePageDescription.textContent =
                descriptions[currentProfilePage];

            updateProfileContent();
        });
    });

    /* ==============================
       刪除長輩編號
    ============================== */

    deleteElderButton.addEventListener("click", function () {
        if (!currentProfileElderId) {
            return;
        }

        deleteModalText.textContent =
            "是否確認刪除 " + currentProfileElderId;

        deleteModal.classList.remove("hidden");
    });

    cancelDeleteButton.addEventListener("click", function () {
        deleteModal.classList.add("hidden");
    });

    confirmDeleteButton.addEventListener(
        "click",
        async function () {

            if (!currentProfileElderId) {
                return;
            }

            const elderIdToDelete = currentProfileElderId;

            // 防止連續點擊
            confirmDeleteButton.disabled = true;

            try {
                await remove(
                    ref(
                        database,
                        "players/" + elderIdToDelete
                    )
                );

                elderIds = elderIds.filter(
                    elderId => elderId !== elderIdToDelete
                );

                groupRequestVersion++;
                profileRequestVersion++;

                renderElderCards();

                deleteModal.classList.add("hidden");

                currentProfileElderId = null;
                singleSearchInput.value = "";

                showSearchPanel();

            } catch (error) {
                console.error("刪除長輩編號失敗：", error);
                alert("刪除失敗，請稍後再試");

            } finally {
                confirmDeleteButton.disabled = false;
            }
        }
    );

    deleteModal.addEventListener("click", function (event) {
        if (event.target === deleteModal) {
            deleteModal.classList.add("hidden");
        }
    });

    /* ==============================
       第一次載入
    ============================== */

    async function initializeDashboard() {
        document.body.classList.remove(
            "single-mode-active"
        );

        await loadElderIdsFromFirebase();

        renderElderCards();
        updateDateDisplay();

        console.log("Transfer Dashboard 載入完成");
    }

    initializeDashboard();

});
