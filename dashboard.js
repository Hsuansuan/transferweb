
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAaNj6Znk30zLZM3QVvEEPdSnPFjJyr_LE",
    authDomain: "transfer-2b40c.firebaseapp.com",
    databaseURL: "https://transfer-2b40c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "transfer-2b40c",
    storageBucket: "transfer-2b40c.firebasestorage.app",
    messagingSenderId: "1041873060739",
    appId: "1:1041873060739:web:a61497c1cfe0854a8becb6"
};

const database = getDatabase(initializeApp(firebaseConfig));

document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    const descriptions = {
        success: "透過總成功率可以看到成功、失敗與總數",
        visual: "亮起第一顆燈後，使用者幾秒成功接上第一條線",
        memory: "聲音播放後，燈光提示出現幾次",
        hearing: "聲音播放後，使用者成功接上第二條線的平均時間",
        "today-analysis": "統整選擇日期的當日遊玩表現",
        "compare-analysis": "比較歷史遊玩表現與趨勢"
    };

    let elderIds = [];
    let currentGroupPage = "success";
    let currentProfilePage = "success";
    let currentProfileElderId = null;
    let groupRequestVersion = 0;
    let profileRequestVersion = 0;
    let trendDays = 7;

    const categoryButtons = document.querySelectorAll(".category-button");
    const profileCategoryButtons = document.querySelectorAll(".profile-category-button");
    const pageDescription = $("pageDescription");
    const peopleGrid = $("peopleGrid");
    const groupSearchInput = $("groupSearchInput");
    const groupAddElderButton = $("groupAddElderButton");
    const previousDateButton = $("previousDate");
    const nextDateButton = $("nextDate");
    const currentYearText = $("currentYear");
    const currentDateText = $("currentDate");
    const openCalendarButton = $("openCalendarButton");
    const customCalendar = $("customCalendar");
    const calendarPrevMonth = $("calendarPrevMonth");
    const calendarNextMonth = $("calendarNextMonth");
    const calendarMonthTitle = $("calendarMonthTitle");
    const calendarDays = $("calendarDays");
    const calendarTodayButton = $("calendarTodayButton");
    const modeButton = $("modeButton");
    const modeButtonText = $("modeButtonText");
    const modeDropdown = $("modeDropdown");
    const modeSubtitle = $("modeSubtitle");
    const modeOptions = modeDropdown.querySelectorAll("button");
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

    function getToday() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }

    let selectedDate = getToday();
    let calendarViewDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
    );

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getSelectedDateString() {
        return formatDate(selectedDate);
    }

    function updateDateDisplay() {
        currentYearText.textContent = selectedDate.getFullYear();
        currentDateText.textContent = `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`;

        const isToday = selectedDate >= getToday();
        nextDateButton.disabled = isToday;
        nextDateButton.style.opacity = isToday ? "0.3" : "1";
        nextDateButton.style.cursor = isToday ? "default" : "pointer";

        if (!customCalendar.classList.contains("hidden")) renderCalendar();
        if (!groupModeContent.classList.contains("hidden")) updateAllElderCards();
        if (!singleProfilePanel.classList.contains("hidden")) updateProfileContent();
    }

    function selectDate(date) {
        date.setHours(0, 0, 0, 0);
        if (date > getToday()) return;

        selectedDate = new Date(date);
        calendarViewDate = new Date(date.getFullYear(), date.getMonth(), 1);
        updateDateDisplay();
        closeCalendar();
    }

    previousDateButton.addEventListener("click", () => {
        const previous = new Date(selectedDate);
        previous.setDate(previous.getDate() - 1);
        selectDate(previous);
    });

    nextDateButton.addEventListener("click", () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        selectDate(next);
    });

    function openCalendar() {
        calendarViewDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
        );
        customCalendar.classList.remove("hidden");
        openCalendarButton.setAttribute("aria-expanded", "true");
        renderCalendar();
    }

    function closeCalendar() {
        customCalendar.classList.add("hidden");
        openCalendarButton.setAttribute("aria-expanded", "false");
    }

    function renderCalendar() {
        const year = calendarViewDate.getFullYear();
        const month = calendarViewDate.getMonth();
        const today = getToday();

        calendarMonthTitle.textContent = `${year} 年 ${month + 1} 月`;
        calendarDays.innerHTML = "";

        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

        for (let index = 0; index < cellCount; index++) {
            const day = index - firstWeekday + 1;

            if (day < 1 || day > daysInMonth) {
                const empty = document.createElement("span");
                empty.className = "calendar-empty";
                calendarDays.appendChild(empty);
                continue;
            }

            const date = new Date(year, month, day);
            const button = document.createElement("button");

            button.type = "button";
            button.textContent = day;
            button.setAttribute("aria-label", formatDate(date));

            if (+date === +selectedDate) {
                button.classList.add("selected");
                button.setAttribute("aria-pressed", "true");
            }

            if (+date === +today) button.classList.add("today");
            if (date > today) button.disabled = true;

            button.addEventListener("click", () => {
                selectDate(new Date(year, month, day));
            });

            calendarDays.appendChild(button);
        }

        calendarNextMonth.disabled =
            new Date(year, month + 1, 1) >
            new Date(today.getFullYear(), today.getMonth(), 1);
    }

    openCalendarButton.addEventListener("click", () => {
        customCalendar.classList.contains("hidden")
            ? openCalendar()
            : closeCalendar();
    });

    calendarPrevMonth.addEventListener("click", () => {
        calendarViewDate = new Date(
            calendarViewDate.getFullYear(),
            calendarViewDate.getMonth() - 1,
            1
        );
        renderCalendar();
    });

    calendarNextMonth.addEventListener("click", () => {
        const next = new Date(
            calendarViewDate.getFullYear(),
            calendarViewDate.getMonth() + 1,
            1
        );
        const today = getToday();

        if (next > new Date(today.getFullYear(), today.getMonth(), 1)) return;

        calendarViewDate = next;
        renderCalendar();
    });

    calendarTodayButton.addEventListener("click", () => selectDate(getToday()));

    document.addEventListener("click", event => {
        if (!event.target.closest(".calendar-wrapper")) closeCalendar();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeCalendar();
    });

    function safeNumber(value) {
        if (value === null || value === undefined || value === "") return 0;
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function safeCount(value) {
        return Math.max(0, safeNumber(value));
    }

    function normalizeNumberList(value) {
        if (!value) return [];
        if (Array.isArray(value)) {
            return value.filter(item => item !== null && item !== undefined);
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
        const rate = total > 0 ? completed / total * 100 : 0;
        return { completed, failed, total, rate };
    }

    function getRecordTime(record) {
        return typeof record.playedAt === "string" && record.playedAt.length >= 16
            ? record.playedAt.substring(11, 16)
            : "--:--";
    }

    function formatOptionalNumber(value, digits = 2) {
        if (
            value === null ||
            value === undefined ||
            value === "" ||
            !Number.isFinite(Number(value))
        ) return "--";

        return Number(value).toFixed(digits);
    }

    function formatTimeList(value, emptyMessage) {
        const times = normalizeNumberList(value);
        return times.length
            ? times.map((time, index) =>
                `第${index + 1}通：${safeNumber(time).toFixed(2)} 秒<br>`
            ).join("")
            : `${emptyMessage}<br>`;
    }

    async function loadElderIdsFromFirebase() {
        try {
            const snapshot = await get(ref(database, "players"));
            elderIds = snapshot.exists() ? Object.keys(snapshot.val()) : [];
            elderIds.sort((a, b) =>
                a.localeCompare(b, undefined, {
                    numeric: true,
                    sensitivity: "base"
                })
            );
        } catch (error) {
            console.error("讀取玩家編號失敗：", error);
            elderIds = [];
        }
    }

    async function loadElderDailyRecords(elderId, dateString = getSelectedDateString()) {
        try {
            const snapshot = await get(
                ref(database, `players/${elderId}/dates/${dateString}/sessions`)
            );

            if (!snapshot.exists()) return [];

            const records = Object.entries(snapshot.val())
                .filter(([, session]) => session && typeof session === "object")
                .map(([id, session]) => ({ ...session, id }));

            records.sort((a, b) =>
                String(a.playedAt ?? "").localeCompare(String(b.playedAt ?? "")) ||
                String(a.id).localeCompare(String(b.id))
            );

            return records;
        } catch (error) {
            console.error("讀取遊玩紀錄失敗：", error);
            return [];
        }
    }


    function switchMode(mode) {
        const single = mode === "single";

        document.body.classList.toggle("single-mode-active", single);
        modeButtonText.textContent = single ? "單人模式" : "全體模式";
        groupModeContent.classList.toggle("hidden", single);
        singleModeContent.classList.toggle("hidden", !single);

        if (single) {
            groupRequestVersion++;
            showSearchPanel();
        } else {
            profileRequestVersion++;
            updateAllElderCards();
        }

        closeCalendar();
        modeDropdown.classList.remove("show");
    }

    function openElderProfile(elderId) {
        switchMode("single");
        currentProfileElderId = elderId;
        singleSearchInput.value = elderId;
        showProfilePanel(elderId);
    }

    function openGroupAddPanel() {
        switchMode("single");
        newElderInput.value = "";
        showAddPanel();
        newElderInput.focus();
    }

    function renderElderCards() {
        peopleGrid.innerHTML = "";

        if (["today-analysis", "compare-analysis"].includes(currentGroupPage)) {
            updateAllElderCards();
            return;
        }

        peopleGrid.classList.remove("overview-mode");

        elderIds.forEach(elderId => {
            const card = document.createElement("article");
            card.className = "person-card";
            card.dataset.elderId = elderId;
            card.style.cursor = "pointer";
            card.title = "連點兩下查看個人資料";

            const title = document.createElement("h2");
            title.textContent = elderId;

            const data = document.createElement("div");
            data.className = "person-data";
            data.id = "elderData_" + elderId;
            data.textContent = "資料讀取中...";

            card.addEventListener("dblclick", () => openElderProfile(elderId));
            card.append(title, data);
            peopleGrid.appendChild(card);
        });

        filterGroupCards();
        updateAllElderCards();
    }

    function filterGroupCards() {
        const keyword = groupSearchInput.value.trim();

        peopleGrid.querySelectorAll(".person-card").forEach(card => {
            card.style.display =
                !keyword || card.dataset.elderId.includes(keyword) ? "" : "none";
        });
    }

    groupSearchInput.addEventListener("input", filterGroupCards);
    groupAddElderButton.addEventListener("click", openGroupAddPanel);

    function createLatestRecordHtml(record, page) {
        const time = getRecordTime(record);
        const data = getSuccessData(record);

        if (page === "success") {
            return `<div class="record-detail">
                最新紀錄：${time}<br><br>
                成功：${data.completed} 次<br>
                失敗：${data.failed} 次<br>
                總數：${data.total} 次<br>
                成功率：${data.rate.toFixed(1)}%
            </div>`;
        }

        if (page === "visual") {
            return `<div class="record-detail">
                最新紀錄：${time}<br><br>
                ${formatTimeList(record.visualTimes, "無視覺反應紀錄")}
                <strong>平均：${formatOptionalNumber(record.averageVisualTime)} 秒</strong>
            </div>`;
        }

        if (page === "memory") {
            return `<div class="record-detail">
                最新紀錄：${time}<br><br>
                提示次數：${safeCount(record.hintCount)} 次
            </div>`;
        }

        if (page === "hearing") {
            return `<div class="record-detail">
                最新紀錄：${time}<br><br>
                ${formatTimeList(record.hearingTimes, "無聽力反應紀錄")}
                <strong>平均：${formatOptionalNumber(record.averageHearingTime)} 秒</strong>
            </div>`;
        }

        return `<div class="record-detail">
            最新紀錄：${time}<br><br>
            成功率：${data.rate.toFixed(1)}%<br>
            平均視覺反應：${formatOptionalNumber(record.averageVisualTime)} 秒<br>
            提示次數：${safeCount(record.hintCount)} 次<br>
            平均聽力反應：${formatOptionalNumber(record.averageHearingTime)} 秒
        </div>`;
    }

    function mean(values) {
        return values.length
            ? values.reduce((sum, value) => sum + value, 0) / values.length
            : null;
    }

    function metricValue(value, unit = "", digits = 2) {
        return value === null ? "--" : `${value.toFixed(digits)}${unit}`;
    }

    function getMetric(record, type) {
        if (type === "visual" || type === "hearing") {
            const field = type === "visual"
                ? "averageVisualTime"
                : "averageHearingTime";

            const times = normalizeNumberList(record[type + "Times"])
                .map(Number)
                .filter(number => Number.isFinite(number) && number >= 0);

            if (times.length) return mean(times);

            const value = record[field];

            return value !== "" && value != null &&
                Number.isFinite(Number(value)) && Number(value) >= 0
                ? Number(value)
                : null;
        }

        if (type === "memory") {
            return record.hintCount != null &&
                Number.isFinite(Number(record.hintCount))
                ? Math.max(0, Number(record.hintCount))
                : null;
        }

        const data = getSuccessData(record);
        return data.total ? data.rate : null;
    }

    function summarizePeople(people) {
        const active = people.filter(person => person.records.length);

        const byType = type => mean(
            active.map(person =>
                mean(
                    person.records
                        .map(record => getMetric(record, type))
                        .filter(value => value !== null)
                )
            ).filter(value => value !== null)
        );

        const successByPerson = active.map(person => {
            const completed = person.records.reduce(
                (sum, record) => sum + getSuccessData(record).completed, 0
            );

            const total = person.records.reduce(
                (sum, record) => sum + getSuccessData(record).total, 0
            );

            return total ? completed / total * 100 : null;
        }).filter(value => value !== null);

        const distribution = [0, 0, 0, 0];

        successByPerson.forEach(rate => {
            distribution[Math.min(3, Math.floor(rate / 25))]++;
        });

        return {
            active: active.length,
            sessions: active.reduce(
                (sum, person) => sum + person.records.length, 0
            ),
            completed: active.reduce(
                (sum, person) => sum + person.records.reduce(
                    (n, record) => n + getSuccessData(record).completed, 0
                ), 0
            ),
            success: mean(successByPerson),
            visual: byType("visual"),
            memory: byType("memory"),
            hearing: byType("hearing"),
            distribution
        };
    }

    function summaryCard(label, value, note) {
        return `<article class="overview-metric">
            <span>${label}</span>
            <strong>${value}</strong>
            <small>${note}</small>
        </article>`;
    }

    function makeTrendChart(points, key, unit, digits) {
        const values = points.map(point => point[key]);
        const valid = values.filter(value => value !== null);

        if (!valid.length) {
            return '<p class="overview-empty">此期間沒有可分析的資料</p>';
        }

        const maximum = Math.max(...valid, 0.01) * 1.15;
        const width = 620, height = 175;
        const left = 18, right = 12, top = 15, bottom = 24;

        const x = index =>
            left + index * (width - left - right) /
            Math.max(1, points.length - 1);

        const y = value =>
            height - bottom - value / maximum * (height - top - bottom);

        const segments = [];
        let segment = [];

        points.forEach((point, index) => {
            if (point[key] === null) {
                if (segment.length) segments.push(segment);
                segment = [];
            } else {
                segment.push(
                    `${x(index).toFixed(1)},${y(point[key]).toFixed(1)}`
                );
            }
        });

        if (segment.length) segments.push(segment);

        const lines = segments.map(segmentPoints =>
            `<polyline points="${segmentPoints.join(" ")}"
                fill="none" stroke="#77784F" stroke-width="3"
                stroke-linecap="round" stroke-linejoin="round"/>`
        ).join("");

        const circles = points.map((point, index) =>
            point[key] === null ? "" :
                `<circle cx="${x(index).toFixed(1)}"
                    cy="${y(point[key]).toFixed(1)}"
                    r="4" fill="#77784F">
                    <title>${point.date}: ${point[key].toFixed(digits)} ${unit}</title>
                </circle>`
        ).join("");

        const labelIndexes = [
            ...new Set([
                0,
                Math.floor((points.length - 1) / 2),
                points.length - 1
            ])
        ];

        const labels = labelIndexes.map(index =>
            `<text x="${x(index)}" y="${height - 3}"
                text-anchor="middle" font-size="11" fill="#777459">
                ${points[index].date.slice(5)}
            </text>`
        ).join("");

        return `<svg class="overview-line-chart"
            viewBox="0 0 ${width} ${height}"
            role="img" aria-label="${unit}歷史趨勢圖">
            <line x1="${left}" x2="${width - right}"
                y1="${height - bottom}" y2="${height - bottom}"
                stroke="#D7D4C6"/>
            <line x1="${left}" x2="${width - right}"
                y1="${top}" y2="${top}"
                stroke="#EEECE3" stroke-dasharray="5 5"/>
            ${lines}${circles}${labels}
        </svg>`;
    }

    function renderOverview(todayPeople, trendPoints = [], loadingTrend = false) {
        const stats = summarizePeople(todayPeople);
        const total = elderIds.length;
        const participation = total ? stats.active / total * 100 : 0;
        const labels = ["0–25%", "25–50%", "50–75%", "75–100%"];

        const bars = stats.distribution.map((count, index) => {
            const width = stats.active ? count / stats.active * 100 : 0;

            return `<div class="overview-bar-row">
                <span>${labels[index]}</span>
                <div class="overview-bar-track">
                    <div style="width:${width}%"></div>
                </div>
                <strong>${count} 人</strong>
            </div>`;
        }).join("");

        const maxReaction = Math.max(
            stats.visual ?? 0,
            stats.hearing ?? 0,
            0.01
        );

        const reactionBars = [
            ["視覺反應", stats.visual],
            ["聽力反應", stats.hearing]
        ].map(([label, value]) => `
            <div class="overview-bar-row">
                <span>${label}</span>
                <div class="overview-bar-track">
                    <div style="width:${
                        value === null ? 0 : value / maxReaction * 100
                    }%"></div>
                </div>
                <strong>${metricValue(value, " 秒")}</strong>
            </div>
        `).join("");

        const trends = loadingTrend
            ? '<p class="overview-empty">歷史紀錄讀取中...</p>'
            : `<div class="overview-trend-grid">
                <div>
                    <h4>成功率變化</h4>
                    ${makeTrendChart(trendPoints, "success", "%", 1)}
                </div>
                <div>
                    <h4>視覺反應時間變化</h4>
                    ${makeTrendChart(trendPoints, "visual", "秒", 2)}
                </div>
                <div>
                    <h4>燈光提示次數變化</h4>
                    ${makeTrendChart(trendPoints, "memory", "次", 2)}
                </div>
                <div>
                    <h4>聽力反應時間變化</h4>
                    ${makeTrendChart(trendPoints, "hearing", "秒", 2)}
                </div>
            </div>`;

        peopleGrid.classList.add("overview-mode");

        peopleGrid.innerHTML = `
            <div class="overview-dashboard">
                ${currentGroupPage === "today-analysis" ? `
                <div class="overview-metrics">
                    ${summaryCard(
                        "平均成功率",
                        metricValue(stats.success, "%", 1),
                        "有接線紀錄的玩家平均"
                    )}
                    ${summaryCard(
                        "平均視覺反應",
                        metricValue(stats.visual, " 秒"),
                        "第一條線的反應時間"
                    )}
                    ${summaryCard(
                        "平均提示次數",
                        metricValue(stats.memory, " 次"),
                        "每局燈光提示次數"
                    )}
                    ${summaryCard(
                        "平均聽力反應",
                        metricValue(stats.hearing, " 秒"),
                        "第二條線的反應時間"
                    )}
                </div>

                <div class="overview-section-grid">
                    <section class="overview-panel">
                        <h3>遊玩參與率</h3>
                        <div class="overview-large">
                            ${participation.toFixed(1)}<small>%</small>
                        </div>
                        <div class="overview-progress">
                            <div style="width:${participation}%"></div>
                        </div>
                        <p>當日 ${stats.active} 人遊玩／共 ${total} 位玩家</p>
                    </section>

                    <section class="overview-panel">
                        <h3>遊玩概況</h3>
                        <div class="overview-facts">
                            <div>
                                <strong>${stats.active}</strong>
                                <span>遊玩人數</span>
                            </div>
                            <div>
                                <strong>${stats.sessions}</strong>
                                <span>總遊玩局數</span>
                            </div>
                            <div>
                                <strong>${
                                    stats.active
                                        ? (stats.completed / stats.active).toFixed(1)
                                        : "0"
                                }</strong>
                                <span>平均成功次數</span>
                            </div>
                            <div>
                                <strong>${
                                    stats.active
                                        ? (stats.sessions / stats.active).toFixed(1)
                                        : "0"
                                }</strong>
                                <span>平均每人局數</span>
                            </div>
                        </div>
                    </section>

                    <section class="overview-panel">
                        <h3>玩家成功率分布</h3>
                        <p>依每位玩家當日的接線成功率分組</p>
                        ${bars}
                    </section>

                    <section class="overview-panel">
                        <h3>視覺與聽力反應比較</h3>
                        <p>數值越低，代表完成接線所花的時間越短</p>
                        ${reactionBars}
                    </section>
                </div>

                ` : ""}
                ${currentGroupPage === "compare-analysis" ? `
                <section class="overview-panel overview-history">
                    <div class="overview-history-head">
                        <div>
                            <h3>歷史表現趨勢</h3>
                            <p>以選擇日期為終點，按天統計全體平均</p>
                        </div>
                        <div class="overview-range">
                            <button type="button" data-trend="7"
                                class="${trendDays === 7 ? "active" : ""}">
                                近 7 天
                            </button>
                            <button type="button" data-trend="30"
                                class="${trendDays === 30 ? "active" : ""}">
                                近 30 天
                            </button>
                        </div>
                    </div>
                    ${trends}
                </section>
                ` : ""}
            </div>
        `;

        peopleGrid.querySelectorAll("[data-trend]").forEach(button => {
            button.addEventListener("click", () => {
                trendDays = Number(button.dataset.trend);
                updateAllElderCards();
            });
        });
    }


    async function loadTrendPoints(endDate, days, version) {
        const start = new Date(endDate);
        start.setDate(start.getDate() - days + 1);

        const dates = Array.from({ length: days }, (_, index) => {
            const date = new Date(start);
            date.setDate(date.getDate() + index);
            return formatDate(date);
        });

        const byDate = Object.fromEntries(
            dates.map(date => [date, []])
        );

        const playerData = await Promise.all(
            elderIds.map(async elderId => {
                try {
                    const snapshot = await get(
                        ref(database, `players/${elderId}/dates`)
                    );
                    return snapshot.exists() ? snapshot.val() : {};
                } catch (error) {
                    console.error("歷史紀錄讀取失敗：", elderId, error);
                    return {};
                }
            })
        );

        if (version !== groupRequestVersion) return null;

        playerData.forEach((data, index) => {
            dates.forEach(date => {
                const sessions = data[date]?.sessions;

                const records = sessions && typeof sessions === "object"
                    ? Object.values(sessions).filter(
                        record => record && typeof record === "object"
                    )
                    : [];

                if (records.length) {
                    byDate[date].push({
                        elderId: elderIds[index],
                        records
                    });
                }
            });
        });

        return dates.map(date => {
            const stats = summarizePeople(byDate[date]);

            return {
                date,
                success: stats.success,
                visual: stats.visual,
                memory: stats.memory,
                hearing: stats.hearing
            };
        });
    }

    async function updateAllElderCards() {
        const version = ++groupRequestVersion;
        const dateString = getSelectedDateString();
        const page = currentGroupPage;
        const isGroup = !groupModeContent.classList.contains("hidden");

        if (isGroup) {
            modeSubtitle.textContent =
                `當日遊玩人數 讀取中... / ${elderIds.length} 人`;
        }

        if (["today-analysis", "compare-analysis"].includes(page)) {
            peopleGrid.classList.add("overview-mode");
            peopleGrid.innerHTML =
                '<div class="overview-loading">正在整理全體遊玩資料...</div>';
        } else {
            peopleGrid.classList.remove("overview-mode");
        }

        const results = await Promise.all(
            elderIds.map(async elderId => ({
                elderId,
                records: await loadElderDailyRecords(elderId, dateString)
            }))
        );

        if (version !== groupRequestVersion) return;

        const playedCount = results.filter(
            person => person.records.length
        ).length;

        if (isGroup) {
            modeSubtitle.textContent =
                `當日遊玩人數 ${playedCount} / ${elderIds.length} 人`;
        }

        if (["today-analysis", "compare-analysis"].includes(page)) {
            if (page === "today-analysis") {
                renderOverview(results);
                return;
            }

            renderOverview(results, [], true);

            const points = await loadTrendPoints(
                new Date(selectedDate),
                trendDays,
                version
            );

            if (version !== groupRequestVersion || points === null) return;

            renderOverview(results, points, false);
        } else {
            results.forEach(({ elderId, records }) => {
                const element = $("elderData_" + elderId);
                if (!element) return;

                element.innerHTML = records.length
                    ? createLatestRecordHtml(
                        records[records.length - 1],
                        page
                    )
                    : "當日無遊玩紀錄";
            });
        }
    }

    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            categoryButtons.forEach(item => item.classList.remove("active"));
            button.classList.add("active");

            currentGroupPage = button.dataset.page;
            pageDescription.textContent = descriptions[currentGroupPage];
            renderElderCards();
        });
    });

    modeButton.addEventListener("click", () => {
        modeDropdown.classList.toggle("show");
    });

    modeOptions.forEach(option => {
        option.addEventListener("click", () => {
            switchMode(option.dataset.mode);
        });
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".mode-select")) {
            modeDropdown.classList.remove("show");
        }
    });

    // ==========================================
    // 單人模式：玩家查詢與新增
    // ==========================================

    function showSearchPanel() {
        profileRequestVersion++;
        singleSearchPanel.classList.remove("hidden");
        singleAddPanel.classList.add("hidden");
        singleProfilePanel.classList.add("hidden");
        modeSubtitle.textContent = "請查詢玩家編號";
    }

    function showAddPanel() {
        profileRequestVersion++;
        singleSearchPanel.classList.add("hidden");
        singleAddPanel.classList.remove("hidden");
        singleProfilePanel.classList.add("hidden");
        modeSubtitle.textContent = "請新增玩家編號";
    }

    openAddElder.addEventListener("click", showAddPanel);
    backToSearch.addEventListener("click", showSearchPanel);
    backToSingleSearch.addEventListener("click", showSearchPanel);

    async function addElder() {
        const elderId = newElderInput.value.trim();

        if (!elderId) {
            alert("請輸入玩家編號");
            return;
        }

        if (!/^\d+$/.test(elderId)) {
            alert("玩家編號只能使用數字");
            return;
        }

        try {
            const elderReference = ref(database, "players/" + elderId);

            if ((await get(elderReference)).exists()) {
                alert("這個玩家編號已經存在");
                return;
            }

            await set(elderReference, { exists: true });

            if (!elderIds.includes(elderId)) {
                elderIds.push(elderId);
                elderIds.sort((a, b) =>
                    a.localeCompare(b, undefined, {
                        numeric: true,
                        sensitivity: "base"
                    })
                );
            }

            renderElderCards();
            newElderInput.value = "";

            alert(`玩家編號 ${elderId} 新增成功`);
            showSearchPanel();

        } catch (error) {
            console.error("新增玩家失敗：", error);
            alert("新增失敗，請檢查 Firebase 連線或權限");
        }
    }

    addElderButton.addEventListener("click", addElder);

    newElderInput.addEventListener("keydown", event => {
        if (event.key === "Enter") addElder();
    });

    async function searchElder() {
        const elderId = singleSearchInput.value.trim();

        if (!elderId) {
            alert("請輸入玩家編號");
            return;
        }

        if (!/^\d+$/.test(elderId)) {
            alert("玩家編號只能使用數字");
            return;
        }

        try {
            const snapshot = await get(
                ref(database, "players/" + elderId)
            );

            if (!snapshot.exists()) {
                alert("查無此玩家編號");
                return;
            }

            currentProfileElderId = elderId;
            showProfilePanel(elderId);

        } catch (error) {
            console.error("查詢玩家失敗：", error);
            alert("查詢失敗，請稍後再試");
        }
    }

    singleSearchButton.addEventListener("click", searchElder);

    singleSearchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") searchElder();
    });

    function showProfilePanel(elderId) {
        singleSearchPanel.classList.add("hidden");
        singleAddPanel.classList.add("hidden");
        singleProfilePanel.classList.remove("hidden");

        modeSubtitle.textContent = "編號 " + elderId;
        currentProfilePage = "success";

        profileCategoryButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.profilePage === "success"
            );
        });

        profilePageDescription.textContent = descriptions.success;
        updateProfileContent();
    }

    // ==========================================
    // 單人模式：成功率圖表
    // ==========================================

    function createSuccessChartHtml(record) {
        const data = getSuccessData(record);
        const time = getRecordTime(record);

        const background = data.total
            ? `conic-gradient(#686F98 0% ${data.rate}%, #C9CBD9 ${data.rate}% 100%)`
            : "#C9CBD9";

        return `<div class="record-detail">
            <div class="success-record-time">
                遊玩時間：${time}
            </div>

            <div class="success-chart-layout">
                <div class="success-donut"
                    style="background: ${background};">

                    <div class="success-donut-center">
                        <div class="success-donut-rate">
                            ${data.total ? data.rate.toFixed(1) + "%" : "--"}
                        </div>
                        <div class="success-donut-label">成功率</div>
                    </div>
                </div>

                <div class="success-stat-list">
                    <div class="success-stat">
                        <span class="success-stat-dot success-dot-completed"></span>
                        <span>成功次數</span>
                        <strong>${data.completed} 次</strong>
                    </div>

                    <div class="success-stat">
                        <span class="success-stat-dot success-dot-failed"></span>
                        <span>失敗次數</span>
                        <strong>${data.failed} 次</strong>
                    </div>

                    <div class="success-stat success-stat-total">
                        <span>總次數</span>
                        <strong>${data.total} 次</strong>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // ==========================================
    // 單人模式：視覺／聽力反應圖表
    // ==========================================

    function createReactionChartHtml(record, type) {
        const isVisual = type === "visual";
        const time = getRecordTime(record);

        const values = normalizeNumberList(
            isVisual ? record.visualTimes : record.hearingTimes
        )
            .map(Number)
            .filter(value => Number.isFinite(value) && value >= 0);

        const averageValue = getMetric(record, type);
        const average = metricValue(averageValue, "", 2);

        const title = isVisual ? "視覺反應時間" : "聽力反應時間";

        const layoutClass = isVisual
            ? "visual-chart-layout"
            : "hearing-chart-layout";

        if (!values.length) {
            return `<div class="record-detail">
                <div class="success-record-time">
                    遊玩時間：${time}
                </div>

                <div class="${layoutClass}">
                    <div class="visual-empty">
                        無${isVisual ? "視覺" : "聽力"}反應明細紀錄
                    </div>

                    <div class="visual-average">
                        <span>平均${title}</span>
                        <strong>${average} 秒</strong>
                    </div>
                </div>
            </div>`;
        }

        const maximum = Math.max(...values, 0.1);
        const rawStep = maximum / 4;

        const magnitude = Math.pow(
            10,
            Math.floor(Math.log10(rawStep))
        );

        const normalizedStep = rawStep / magnitude;

        const niceStep = (
            normalizedStep <= 1 ? 1 :
            normalizedStep <= 2 ? 2 :
            normalizedStep <= 2.5 ? 2.5 :
            normalizedStep <= 5 ? 5 : 10
        ) * magnitude;

        const axisMaximum = niceStep * 4;

        const ticks = Array.from(
            { length: 5 },
            (_, index) => axisMaximum - niceStep * index
        );

        const yAxisHtml = ticks.map(value =>
            `<span>${Number(value.toFixed(3))}</span>`
        ).join("");

        const gridlinesHtml = ticks.map(() =>
            `<div class="visual-gridline"></div>`
        ).join("");

        const barsHtml = values.map((seconds, index) => {
            const percentage = Math.min(
                100,
                seconds / axisMaximum * 100
            );

            return `<div class="visual-bar-item"
                style="--bar-height: ${percentage}%">

                <div class="visual-bar-value">
                    ${seconds.toFixed(2)}s
                </div>

                <div class="visual-bar"></div>

                <div class="visual-bar-label">
                    第${index + 1}通
                </div>
            </div>`;
        }).join("");

        return `<div class="record-detail">
            <div class="success-record-time">
                遊玩時間：${time}
            </div>

            <div class="${layoutClass}">
                <div class="visual-chart-heading">
                    ${title}（秒）
                </div>

                <div class="visual-chart-scroll">
                    <div class="visual-chart"
                        style="min-width: ${Math.max(500, values.length * 90)}px">

                        <div class="visual-y-axis">
                            ${yAxisHtml}
                        </div>

                        <div class="visual-plot">
                            <div class="visual-gridlines">
                                ${gridlinesHtml}
                            </div>

                            <div class="visual-bars">
                                ${barsHtml}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="visual-average">
                    <span>平均${title}</span>
                    <strong>${average} 秒</strong>
                </div>
            </div>
        </div>`;
    }

    function createVisualChartHtml(record) {
        return createReactionChartHtml(record, "visual");
    }

    function createHearingChartHtml(record) {
        return createReactionChartHtml(record, "hearing");
    }

    // ==========================================
    // 單人模式：記憶提示圖表
    // ==========================================

    function createMemoryChartHtml(record) {
        const time = getRecordTime(record);
        const hints = safeCount(record.hintCount);
        const scaleMaximum = Math.max(5, Math.ceil(hints / 5) * 5);
        const percentage = hints / scaleMaximum * 100;

        return `<div class="record-detail">
            <div class="success-record-time">
                遊玩時間：${time}
            </div>

            <div class="memory-chart-layout">
                <div class="memory-chart-heading">
                    本局燈光提示次數
                </div>

                <div class="memory-count">
                    <strong>${hints}</strong>
                    <span>次提示</span>
                </div>

                <div class="memory-bar-track">
                    <div class="memory-bar-fill"
                        style="width: ${percentage}%">
                    </div>
                </div>

                <div class="memory-scale">
                    <span>0 次</span>
                    <span>${scaleMaximum} 次</span>
                </div>

                <div class="memory-note">
                    顯示本局實際提示次數，刻度依數值調整。
                </div>
            </div>
        </div>`;
    }


    // ==========================================
    // 單人模式：總分析設定
    // ==========================================

    let singleAnalysisMetric = "success";
    let singleAnalysisPeriod = 7;

    const singleMetricSettings = {
        success: {
            label: "接線成功率",
            unit: "%",
            digits: 1,
            higherIsBetter: true
        },
        visual: {
            label: "視覺反應時間",
            unit: "秒",
            digits: 2,
            higherIsBetter: false
        },
        memory: {
            label: "平均提示次數",
            unit: "次／局",
            digits: 2,
            higherIsBetter: false
        },
        hearing: {
            label: "聽力反應時間",
            unit: "秒",
            digits: 2,
            higherIsBetter: false
        }
    };

    function getSingleDaySummary(records) {
        const completed = records.reduce(
            (sum, record) => sum + getSuccessData(record).completed,
            0
        );

        const failed = records.reduce(
            (sum, record) => sum + getSuccessData(record).failed,
            0
        );

        const attempts = completed + failed;

        const averageMetric = type => mean(
            records
                .map(record => getMetric(record, type))
                .filter(value => value !== null)
        );

        return {
            sessions: records.length,
            completed,
            failed,
            attempts,
            success: attempts > 0
                ? completed / attempts * 100
                : null,
            visual: averageMetric("visual"),
            memory: averageMetric("memory"),
            hearing: averageMetric("hearing")
        };
    }

    function getSingleMetricValue(record, type) {
        return getMetric(record, type);
    }

    function formatSingleMetric(value, type) {
        const setting = singleMetricSettings[type];

        return value === null || !Number.isFinite(value)
            ? "--"
            : `${value.toFixed(setting.digits)} ${setting.unit}`;
    }

    function getSingleComparison(current, previous, type) {
        if (current === null || previous === null) {
            return {
                text: "無法比較",
                status: "neutral",
                difference: null
            };
        }

        const difference = current - previous;
        const setting = singleMetricSettings[type];

        if (Math.abs(difference) < 0.000001) {
            return {
                text: "持平",
                status: "neutral",
                difference: 0
            };
        }

        const improved = setting.higherIsBetter
            ? difference > 0
            : difference < 0;

        const direction = difference > 0 ? "+" : "−";
        const amount = Math.abs(difference).toFixed(setting.digits);

        const unit = type === "success" ? "百分點" :
            type === "memory" ? "次／局" : "秒";

        return {
            text: `${direction}${amount} ${unit}（${improved ? "進步" : "退步"}）`,
            status: improved ? "improved" : "declined",
            difference
        };
    }

    function getSingleDateRange(endDate, days) {
        return Array.from({ length: days }, (_, index) => {
            const date = new Date(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate() - days + index
            );

            return formatDate(date);
        });
    }

    function getSingleHistorySummary(history, dates) {
        const dailySummaries = dates
            .map(date => history[date])
            .filter(summary => summary && summary.sessions > 0);

        const result = {
            recordedDays: dailySummaries.length,
            totalDays: dates.length,
            sessions: dailySummaries.reduce(
                (sum, summary) => sum + summary.sessions,
                0
            )
        };

        Object.keys(singleMetricSettings).forEach(type => {
            result[type] = mean(
                dailySummaries
                    .map(summary => summary[type])
                    .filter(value => value !== null)
            );
        });

        return result;
    }

    async function loadSingleAnalysisHistory(elderId, version) {
        try {
            const snapshot = await get(
                ref(database, `players/${elderId}/dates`)
            );

            if (version !== profileRequestVersion) return null;

            if (!snapshot.exists()) return {};

            const dates = snapshot.val();
            const history = {};

            Object.entries(dates).forEach(([date, dateData]) => {
                const sessions = dateData?.sessions;

                if (!sessions || typeof sessions !== "object") {
                    return;
                }

                const records = Object.values(sessions).filter(
                    record => record && typeof record === "object"
                );

                if (records.length) {
                    history[date] = getSingleDaySummary(records);
                }
            });

            return history;

        } catch (error) {
            console.error("單人歷史資料讀取失敗：", error);
            return {};
        }
    }

    // ==========================================
    // 單人模式：逐局趨勢圖
    // ==========================================


    function createSingleSessionChart(records, type) {
        const setting = singleMetricSettings[type];

        const points = records.map((record, index) => ({
            label: `第 ${index + 1} 局`,
            time: getRecordTime(record),
            value: getSingleMetricValue(record, type)
        }));

        const valid = points.filter(point => point.value !== null);

        if (!valid.length) {
            return `<p class="single-analysis-empty">
                當日沒有${setting.label}的有效資料
            </p>`;
        }

        const maximum = Math.max(
            ...valid.map(point => point.value),
            0.01
        );

        const chartHeight = 180;
        const chartWidth = Math.max(600, records.length * 95);

        const left = 45;
        const right = 30;
        const top = 25;
        const bottom = 40;

        const x = index =>
            left + index * (chartWidth - left - right) /
            Math.max(1, points.length - 1);

        const y = value =>
            chartHeight - bottom -
            value / (maximum * 1.2) *
            (chartHeight - top - bottom);

        const lines = [];
        let segment = [];

        points.forEach((point, index) => {
            if (point.value === null) {
                if (segment.length > 1) {
                    lines.push(segment);
                }

                segment = [];
            } else {
                segment.push(
                    `${x(index).toFixed(1)},${y(point.value).toFixed(1)}`
                );
            }
        });

        if (segment.length > 1) lines.push(segment);

        const lineHtml = lines.map(line =>
            `<polyline
                points="${line.join(" ")}"
                fill="none"
                stroke="#686F98"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
            />`
        ).join("");

        const dotsHtml = points.map((point, index) => {
            if (point.value === null) return "";

            return `<circle
                cx="${x(index)}"
                cy="${y(point.value)}"
                r="5"
                fill="#686F98"
            >
                <title>
                    ${point.label}：
                    ${formatSingleMetric(point.value, type)}
                </title>
            </circle>`;
        }).join("");

        const labelsHtml = points.map((point, index) =>
            `<text
                x="${x(index)}"
                y="${chartHeight - 12}"
                text-anchor="middle"
                font-size="12"
                fill="#696A80"
            >
                ${index + 1}
            </text>`
        ).join("");

        return `
            <div class="single-analysis-chart-scroll">
                <svg
                    class="single-analysis-line-chart"
                    viewBox="0 0 ${chartWidth} ${chartHeight}"
                    style="min-width:${chartWidth}px"
                    role="img"
                    aria-label="${setting.label}逐局變化圖"
                >
                    <line
                        x1="${left}"
                        x2="${chartWidth - right}"
                        y1="${chartHeight - bottom}"
                        y2="${chartHeight - bottom}"
                        stroke="#CFD1DF"
                    />

                    ${lineHtml}
                    ${dotsHtml}
                    ${labelsHtml}
                </svg>
            </div>
            <p class="single-analysis-chart-note">
                橫軸為遊玩局數，縱軸為${setting.label}
            </p>
        `;
    }

    // ==========================================
    // 單人模式：逐局進步分析
    // ==========================================

    function createSingleSessionProgress(records, type) {
        if (!records.length) {
            return `<p class="single-analysis-empty">
                當日沒有遊玩紀錄
            </p>`;
        }

        const values = records.map(record =>
            getSingleMetricValue(record, type)
        );

        const rows = records.map((record, index) => {
            const value = values[index];

            const previous = index > 0
                ? values[index - 1]
                : null;

            const comparison = index === 0
                ? {
                    text: "第一局（基準）",
                    status: "neutral"
                }
                : getSingleComparison(value, previous, type);

            return `
                <div class="single-analysis-session-row">
                    <div class="single-analysis-session-name">
                        <strong>第 ${index + 1} 局</strong>
                        <small>${getRecordTime(record)}</small>
                    </div>

                    <strong class="single-analysis-session-value">
                        ${formatSingleMetric(value, type)}
                    </strong>

                    <span class="single-analysis-change ${comparison.status}">
                        ${comparison.text}
                    </span>
                </div>
            `;
        }).join("");

        const first = values[0];
        const last = values[values.length - 1];

        let overallText = "需要至少兩局才能比較";

        if (records.length >= 2) {
            overallText = getSingleComparison(
                last,
                first,
                type
            ).text;
        }

        return `
            <div class="single-analysis-progress-summary">
                <span>首局與末局比較</span>
                <strong>${overallText}</strong>
            </div>

            <div class="single-analysis-session-list">
                ${rows}
            </div>

            <p class="single-analysis-chart-note">
                每局變化是與前一局比較。
            </p>
        `;
    }

    // ==========================================
    // 單人模式：歷史比較表
    // ==========================================

    function createSingleHistoryComparison(
        todaySummary,
        history,
        selected
    ) {
        const yesterday = new Date(selected);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayString = formatDate(yesterday);

        const periods = [
            {
                label: "前一天",
                summary: history[yesterdayString] || null
            },
            {
                label: "前 7 天",
                summary: getSingleHistorySummary(
                    history,
                    getSingleDateRange(selected, 7)
                )
            },
            {
                label: "前 30 天",
                summary: getSingleHistorySummary(
                    history,
                    getSingleDateRange(selected, 30)
                )
            }
        ];

        const rows = Object.entries(singleMetricSettings).map(
            ([type, setting]) => {
                const current = todaySummary[type];

                const cells = periods.map(period => {
                    const previous = period.summary?.[type] ?? null;

                    const comparison = getSingleComparison(
                        current,
                        previous,
                        type
                    );

                    return `
                        <td>
                            <strong>
                                ${formatSingleMetric(previous, type)}
                            </strong>
                            <small class="single-analysis-change ${comparison.status}">
                                ${comparison.text}
                            </small>
                        </td>
                    `;
                }).join("");

                return `
                    <tr>
                        <th>${setting.label}</th>
                        <td>
                            <strong>
                                ${formatSingleMetric(current, type)}
                            </strong>
                        </td>
                        ${cells}
                    </tr>
                `;
            }
        ).join("");

        return `
            <div class="single-analysis-table-scroll">
                <table class="single-analysis-table">
                    <thead>
                        <tr>
                            <th>分析項目</th>
                            <th>選擇日期</th>
                            <th>前一天</th>
                            <th>前 7 天平均</th>
                            <th>前 30 天平均</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>

            <p class="single-analysis-chart-note">
                每個日期等權重，不將缺少紀錄視為 0。
                成功率差異以百分點表示。
            </p>
        `;
    }

    // ==========================================
    // 單人模式：歷史趨勢圖
    // ==========================================

    function createSingleHistoryTrend(
        history,
        selected,
        days,
        type
    ) {
        const dates = getSingleDateRange(selected, days);

        dates.push(formatDate(selected));

        const points = dates.map(date => ({
            date,
            value: history[date]?.[type] ?? null
        }));

        const valid = points.filter(point => point.value !== null);

        if (!valid.length) {
            return `<p class="single-analysis-empty">
                此期間沒有可分析的歷史資料
            </p>`;
        }

        const width = Math.max(650, points.length * 24);
        const height = 200;

        const left = 35;
        const right = 25;
        const top = 25;
        const bottom = 40;

        const maximum = Math.max(
            ...valid.map(point => point.value),
            0.01
        ) * 1.2;

        const x = index =>
            left + index * (width - left - right) /
            Math.max(1, points.length - 1);

        const y = value =>
            height - bottom -
            value / maximum * (height - top - bottom);

        const segments = [];
        let segment = [];

        points.forEach((point, index) => {
            if (point.value === null) {
                if (segment.length > 1) {
                    segments.push(segment);
                }
                segment = [];
            } else {
                segment.push(
                    `${x(index).toFixed(1)},${y(point.value).toFixed(1)}`
                );
            }
        });

        if (segment.length > 1) segments.push(segment);

        const lines = segments.map(segmentPoints =>
            `<polyline
                points="${segmentPoints.join(" ")}"
                fill="none"
                stroke="#686F98"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
            />`
        ).join("");

        const dots = points.map((point, index) => {
            if (point.value === null) return "";

            return `
                <circle
                    cx="${x(index)}"
                    cy="${y(point.value)}"
                    r="4"
                    fill="#686F98"
                >
                    <title>
                        ${point.date}：
                        ${formatSingleMetric(point.value, type)}
                    </title>
                </circle>
            `;
        }).join("");

        const labelIndexes = [
            ...new Set([
                0,
                Math.floor((points.length - 1) / 2),
                points.length - 1
            ])
        ];

        const labels = labelIndexes.map(index =>
            `<text
                x="${x(index)}"
                y="${height - 12}"
                text-anchor="middle"
                font-size="12"
                fill="#696A80"
            >
                ${points[index].date.slice(5)}
            </text>`
        ).join("");

        return `
            <div class="single-analysis-chart-scroll">
                <svg
                    class="single-analysis-line-chart"
                    viewBox="0 0 ${width} ${height}"
                    style="min-width:${width}px"
                    role="img"
                    aria-label="單人歷史趨勢圖"
                >
                    <line
                        x1="${left}"
                        x2="${width - right}"
                        y1="${height - bottom}"
                        y2="${height - bottom}"
                        stroke="#CFD1DF"
                    />

                    ${lines}
                    ${dots}
                    ${labels}
                </svg>
            </div>
        `;
    }

    // ==========================================
    // 單人模式：今日分析與比對分析畫面
    // ==========================================

    function createSingleAnalysisHtml(records, history) {
        const todaySummary = getSingleDaySummary(records);
        const selected = new Date(selectedDate);

        const metricButtons = Object.entries(
            singleMetricSettings
        ).map(([type, setting]) => `
            <button
                type="button"
                data-single-metric="${type}"
                class="${singleAnalysisMetric === type ? "active" : ""}"
            >
                ${setting.label}
            </button>
        `).join("");

        const periodButtons = [7, 30].map(days => `
            <button
                type="button"
                data-single-period="${days}"
                class="${singleAnalysisPeriod === days ? "active" : ""}"
            >
                近 ${days} 天
            </button>
        `).join("");

        return `
            <div class="single-analysis-dashboard">

                ${currentProfilePage === "today-analysis" ? `
                <section class="single-analysis-section">
                    <div class="single-analysis-section-heading">
                        <div>
                            <h3>當日整體表現</h3>
                        </div>
                    </div>

                    <div class="single-analysis-metrics">
                        <article class="single-analysis-metric">
                            <span>接線成功率</span>
                            <strong>
                                ${formatSingleMetric(todaySummary.success, "success")}
                            </strong>
                            <small>
                                成功 ${todaySummary.completed} 次／
                                總接線 ${todaySummary.attempts} 次
                            </small>
                        </article>

                        <article class="single-analysis-metric">
                            <span>平均視覺反應</span>
                            <strong>
                                ${formatSingleMetric(todaySummary.visual, "visual")}
                            </strong>
                            <small>各局有效平均值</small>
                        </article>

                        <article class="single-analysis-metric">
                            <span>平均提示次數</span>
                            <strong>
                                ${formatSingleMetric(todaySummary.memory, "memory")}
                            </strong>
                            <small>平均每局提示次數</small>
                        </article>

                        <article class="single-analysis-metric">
                            <span>平均聽力反應</span>
                            <strong>
                                ${formatSingleMetric(todaySummary.hearing, "hearing")}
                            </strong>
                            <small>各局有效平均值</small>
                        </article>
                    </div>

                    <div class="single-analysis-facts">
                        <div>
                            <strong>${todaySummary.sessions}</strong>
                            <span>當日遊玩局數</span>
                        </div>
                        <div>
                            <strong>${todaySummary.completed}</strong>
                            <span>成功接線</span>
                        </div>
                        <div>
                            <strong>${todaySummary.failed}</strong>
                            <span>失敗接線</span>
                        </div>
                        <div>
                            <strong>${todaySummary.attempts}</strong>
                            <span>總接線次數</span>
                        </div>
                    </div>
                </section>

                <section class="single-analysis-section">
                    <div class="single-analysis-section-heading">
                        <div>
                            <h3>當日逐局進步分析</h3>
                            <p>比較當天每一局的遊玩表現</p>
                        </div>
                    </div>

                    <div class="single-analysis-tabs">
                        ${metricButtons}
                    </div>

                    ${createSingleSessionChart(
                        records,
                        singleAnalysisMetric
                    )}

                    ${createSingleSessionProgress(
                        records,
                        singleAnalysisMetric
                    )}
                </section>
                ` : ""}

                ${currentProfilePage === "compare-analysis" ? `
                <section class="single-analysis-section">
                    <div class="single-analysis-section-heading">
                        <div>
                            <h3>歷史表現比較</h3>
                            <p>
                                比較選擇日期與前一天、
                                前 7 天及前 30 天的表現
                            </p>
                        </div>
                    </div>

                    ${createSingleHistoryComparison(
                        todaySummary,
                        history,
                        selected
                    )}
                </section>

                <section class="single-analysis-section">
                    <div class="single-analysis-section-heading">
                        <div>
                            <h3>歷史表現趨勢</h3>
                            <p>觀察不同日期的表現變化</p>
                        </div>

                        <div class="single-analysis-period">
                            ${periodButtons}
                        </div>
                    </div>

                    <div class="single-analysis-tabs">
                        ${metricButtons}
                    </div>

                    <h4>
                        ${singleMetricSettings[singleAnalysisMetric].label}
                    </h4>

                    ${createSingleHistoryTrend(
                        history,
                        selected,
                        singleAnalysisPeriod,
                        singleAnalysisMetric
                    )}
                </section>
                ` : ""}
            </div>
        `;
    }

    function bindSingleAnalysisEvents(records, history) {
        profileContent.querySelectorAll(
            "[data-single-metric]"
        ).forEach(button => {
            button.addEventListener("click", () => {
                singleAnalysisMetric = button.dataset.singleMetric;

                profileContent.innerHTML = createSingleAnalysisHtml(
                    records,
                    history
                );

                bindSingleAnalysisEvents(records, history);
            });
        });

        profileContent.querySelectorAll(
            "[data-single-period]"
        ).forEach(button => {
            button.addEventListener("click", () => {
                singleAnalysisPeriod = Number(
                    button.dataset.singlePeriod
                );

                profileContent.innerHTML = createSingleAnalysisHtml(
                    records,
                    history
                );

                bindSingleAnalysisEvents(records, history);
            });
        });
    }

    // ==========================================
    // 單人模式：各頁籤內容
    // ==========================================

    function createProfileRecordHtml(record, page) {
        switch (page) {
            case "success":
                return createSuccessChartHtml(record);

            case "visual":
                return createVisualChartHtml(record);

            case "memory":
                return createMemoryChartHtml(record);

            case "hearing":
                return createHearingChartHtml(record);

            default:
                return "";
        }
    }

    // ==========================================
    // 單人模式：讀取並更新玩家資料
    // ==========================================

    async function updateProfileContent() {
        if (!currentProfileElderId) return;

        const version = ++profileRequestVersion;
        const elderId = currentProfileElderId;
        const dateString = getSelectedDateString();
        const page = currentProfilePage;

        profileContent.textContent = "資料讀取中...";

        const records = await loadElderDailyRecords(
            elderId,
            dateString
        );

        if (
            version !== profileRequestVersion ||
            singleProfilePanel.classList.contains("hidden")
        ) {
            return;
        }

        // ======================================
        // 今日分析與比對分析
        // ======================================

        if (["today-analysis", "compare-analysis"].includes(page)) {
            let history = {};

            if (page === "compare-analysis") {
                profileContent.textContent =
                    "正在整理當日與歷史遊玩資料...";

                history = await loadSingleAnalysisHistory(
                    elderId,
                    version
                );

                if (
                    version !== profileRequestVersion ||
                    singleProfilePanel.classList.contains("hidden") ||
                    history === null
                ) {
                    return;
                }
            }

            if (records.length) {
                history[dateString] = getSingleDaySummary(records);
            }

            profileContent.innerHTML = createSingleAnalysisHtml(
                records,
                history
            );

            bindSingleAnalysisEvents(records, history);

            return;
        }

        // ======================================
        // 其他四個頁籤：保留原本逐局顯示
        // ======================================

        if (!records.length) {
            profileContent.textContent = "當日無遊玩紀錄";
            return;
        }

        const numberedRecords = records.map(
            (record, index) => ({
                record,
                sessionNumber: index + 1
            })
        ).reverse();

        profileContent.innerHTML = numberedRecords.map(item => `
            <div class="profile-session-record">

                <div class="profile-session-title">
                    第 ${item.sessionNumber} 局
                </div>

                ${createProfileRecordHtml(
                    item.record,
                    page
                )}

            </div>
        `).join("");
    }

    // ==========================================
    // 單人模式：頁籤切換
    // ==========================================

    profileCategoryButtons.forEach(button => {
        button.addEventListener("click", () => {

            profileCategoryButtons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            currentProfilePage =
                button.dataset.profilePage;

            if (currentProfilePage === "today-analysis") {
                profilePageDescription.textContent =
                    "統整當日整體表現及逐局進步情形";
            } else if (currentProfilePage === "compare-analysis") {
                profilePageDescription.textContent =
                    "比較歷史遊玩表現與不同日期的變化趨勢";
            } else {
                profilePageDescription.textContent =
                    descriptions[currentProfilePage];
            }

            updateProfileContent();
        });
    });

    // ==========================================
    // 單人模式：刪除玩家
    // ==========================================

    deleteElderButton.addEventListener("click", () => {
        if (!currentProfileElderId) return;

        deleteModalText.textContent =
            "是否確認刪除玩家 " + currentProfileElderId +
            "？此操作將一併刪除所有遊玩紀錄。";

        deleteModal.classList.remove("hidden");
    });

    cancelDeleteButton.addEventListener("click", () => {
        deleteModal.classList.add("hidden");
    });

    confirmDeleteButton.addEventListener("click", async () => {
        if (!currentProfileElderId) return;

        const elderIdToDelete = currentProfileElderId;

        confirmDeleteButton.disabled = true;

        try {
            await remove(
                ref(database, "players/" + elderIdToDelete)
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
            console.error("刪除玩家失敗：", error);

            alert("刪除失敗，請稍後再試");

        } finally {
            confirmDeleteButton.disabled = false;
        }
    });

    // 點擊遮罩關閉刪除確認視窗
    deleteModal.addEventListener("click", event => {
        if (event.target === deleteModal) {
            deleteModal.classList.add("hidden");
        }
    });

    // ==========================================
    // 系統初始化
    // ==========================================

    async function initializeDashboard() {
        document.body.classList.remove(
            "single-mode-active"
        );

        updateDateDisplay();

        await loadElderIdsFromFirebase();

        renderElderCards();

        console.log(
            "Transfer Dashboard 載入完成！"
        );
    }

    initializeDashboard();

});
