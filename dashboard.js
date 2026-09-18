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


/* Firebase */

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

const firebaseApp =
    initializeApp(firebaseConfig);

const database =
    getDatabase(firebaseApp);

console.log(
    "Firebase Realtime Database 連線完成！"
);


/* 開始 */

document.addEventListener(
    "DOMContentLoaded",
    function ()
    {
        const descriptions = {
            success:
                "透過總成功率可以看到成功、失敗與總數",

            visual:
                "亮起第一顆燈後，使用者幾秒成功接上第一條線",

            memory:
                "聲音播放後，燈光提示出現幾次",

            hearing:
                "聲音播放後，使用者成功接上第二條線的平均時間",

            analysis:
                "透過總分析可以對比全體遊玩資料"
        };


        let elderIds = [];


        /* 全體模式 */

        const categoryButtons =
            document.querySelectorAll(
                ".category-button"
            );

        const pageDescription =
            document.getElementById(
                "pageDescription"
            );

        const peopleGrid =
            document.getElementById(
                "peopleGrid"
            );

        const groupSearchInput =
            document.getElementById(
                "groupSearchInput"
            );

        let currentGroupPage =
            "success";


        /* 日期 */

        const previousDateButton =
            document.getElementById(
                "previousDate"
            );

        const nextDateButton =
            document.getElementById(
                "nextDate"
            );

        const currentYearText =
            document.getElementById(
                "currentYear"
            );

        const currentDateText =
            document.getElementById(
                "currentDate"
            );

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        let selectedDate =
            new Date(today);


        /* 模式 */

        const modeButton =
            document.getElementById(
                "modeButton"
            );

        const modeButtonText =
            document.getElementById(
                "modeButtonText"
            );

        const modeDropdown =
            document.getElementById(
                "modeDropdown"
            );

        const modeOptions =
            modeDropdown.querySelectorAll(
                "button"
            );

        const modeSubtitle =
            document.getElementById(
                "modeSubtitle"
            );

        const groupModeContent =
            document.getElementById(
                "groupModeContent"
            );

        const singleModeContent =
            document.getElementById(
                "singleModeContent"
            );


        /* 單人查詢 */

        const singleSearchPanel =
            document.getElementById(
                "singleSearchPanel"
            );

        const singleSearchInput =
            document.getElementById(
                "singleSearchInput"
            );

        const singleSearchButton =
            document.getElementById(
                "singleSearchButton"
            );


        /* 單人新增 */

        const singleAddPanel =
            document.getElementById(
                "singleAddPanel"
            );

        const newElderInput =
            document.getElementById(
                "newElderInput"
            );

        const addElderButton =
            document.getElementById(
                "addElderButton"
            );

        const openAddElder =
            document.getElementById(
                "openAddElder"
            );

        const backToSearch =
            document.getElementById(
                "backToSearch"
            );


        /* 個人頁 */

        const singleProfilePanel =
            document.getElementById(
                "singleProfilePanel"
            );

        const backToSingleSearch =
            document.getElementById(
                "backToSingleSearch"
            );

        const profileCategoryButtons =
            document.querySelectorAll(
                ".profile-category-button"
            );

        const profilePageDescription =
            document.getElementById(
                "profilePageDescription"
            );

        const profileContent =
            document.getElementById(
                "profileContent"
            );

        let currentProfilePage =
            "success";

        let currentProfileElderId =
            null;


        /* 刪除 */

        const deleteElderButton =
            document.getElementById(
                "deleteElderButton"
            );

        const deleteModal =
            document.getElementById(
                "deleteModal"
            );

        const deleteModalText =
            document.getElementById(
                "deleteModalText"
            );

        const confirmDeleteButton =
            document.getElementById(
                "confirmDeleteButton"
            );

        const cancelDeleteButton =
            document.getElementById(
                "cancelDeleteButton"
            );


        /* 日期格式 */

        function getSelectedDateString()
        {
            const year =
                selectedDate.getFullYear();

            const month =
                String(
                    selectedDate.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );

            const day =
                String(
                    selectedDate.getDate()
                ).padStart(
                    2,
                    "0"
                );

            return (
                year +
                "-" +
                month +
                "-" +
                day
            );
        }


        /* 讀取長輩 */

        async function loadElderIdsFromFirebase()
        {
            try
            {
                const playersReference =
                    ref(
                        database,
                        "players"
                    );

                const snapshot =
                    await get(
                        playersReference
                    );

                if (!snapshot.exists())
                {
                    elderIds = [];

                    console.log(
                        "Firebase目前沒有任何長輩編號。"
                    );

                    return;
                }

                const players =
                    snapshot.val();

                elderIds =
                    Object.keys(players)
                        .sort(
                            function (a, b)
                            {
                                return a.localeCompare(
                                    b,
                                    undefined,
                                    {
                                        numeric: true,
                                        sensitivity: "base"
                                    }
                                );
                            }
                        );
            }
            catch (error)
            {
                console.error(
                    "讀取長輩編號失敗：",
                    error
                );

                elderIds = [];
            }
        }


        /* 建立卡片 */

        function renderElderCards()
        {
            peopleGrid.innerHTML =
                "";

            elderIds.forEach(
                function (elderId)
                {
                    const card =
                        document.createElement(
                            "article"
                        );

                    card.className =
                        "person-card";

                    card.dataset.elderId =
                        elderId;

                    const title =
                        document.createElement(
                            "h2"
                        );

                    title.textContent =
                        elderId;

                    const data =
                        document.createElement(
                            "div"
                        );

                    data.className =
                        "person-data";

                    data.id =
                        "elderData_" +
                        elderId;

                    data.textContent =
                        "資料讀取中...";

                    card.appendChild(
                        title
                    );

                    card.appendChild(
                        data
                    );

                    peopleGrid.appendChild(
                        card
                    );
                }
            );

            updateAllElderCards();
        }


        /* 數字資料 */

        function normalizeNumberList(value)
        {
            if (!value)
            {
                return [];
            }

            if (Array.isArray(value))
            {
                return value.filter(
                    function (item)
                    {
                        return item !== null &&
                               item !== undefined;
                    }
                );
            }

            if (typeof value === "object")
            {
                return Object.keys(value)
                    .sort(
                        function (a, b)
                        {
                            return Number(a) -
                                   Number(b);
                        }
                    )
                    .map(
                        function (key)
                        {
                            return value[key];
                        }
                    );
            }

            return [];
        }


        /* 讀取紀錄 */

        async function loadElderDailyRecords(
            elderId
        )
        {
            try
            {
                const selectedDateString =
                    getSelectedDateString();

                const sessionsPath =
                    "players/" +
                    elderId +
                    "/dates/" +
                    selectedDateString +
                    "/sessions";

                const sessionsReference =
                    ref(
                        database,
                        sessionsPath
                    );

                const snapshot =
                    await get(
                        sessionsReference
                    );

                if (!snapshot.exists())
                {
                    return [];
                }

                const sessions =
                    snapshot.val();

                const result =
                    [];

                Object.entries(
                    sessions
                ).forEach(
                    function (
                        [
                            sessionId,
                            session
                        ]
                    )
                    {
                        if (!session)
                        {
                            return;
                        }

                        result.push(
                            {
                                id:
                                    sessionId,

                                ...session
                            }
                        );
                    }
                );

                result.sort(
                    function (a, b)
                    {
                        const timeA =
                            a.playedAt ??
                            "";

                        const timeB =
                            b.playedAt ??
                            "";

                        return timeA.localeCompare(
                            timeB
                        );
                    }
                );

                return result;
            }
            catch (error)
            {
                console.error(
                    "讀取編號 " +
                    elderId +
                    " 的 Firebase 紀錄失敗：",
                    error
                );

                return [];
            }
        }


        /* 全體紀錄 */

        function createLatestRecordHtml(
            record,
            page
        )
        {
            const latestTime =
                record.playedAt
                    ?
                    record.playedAt.substring(
                        11,
                        16
                    )
                    :
                    "--:--";

            if (page === "success")
            {
                const completed =
                    Number(
                        record.completedCalls ??
                        0
                    );

                const failed =
                    Number(
                        record.failedCalls ??
                        0
                    );

                const total =
                    completed +
                    failed;

                const rate =
                    total > 0
                        ?
                        completed /
                        total *
                        100
                        :
                        0;

                return `
                    <div class="record-detail">
                        最新紀錄：${latestTime}
                        <br><br>
                        成功：${completed} 次
                        <br>
                        失敗：${failed} 次
                        <br>
                        總數：${total} 次
                        <br>
                        成功率：${rate.toFixed(1)}%
                    </div>
                `;
            }

            if (page === "visual")
            {
                const times =
                    normalizeNumberList(
                        record.visualTimes
                    );

                let html =
                    "";

                times.forEach(
                    function (
                        time,
                        index
                    )
                    {
                        html +=
                            `第${index + 1}通：
                            ${Number(time).toFixed(2)}
                            秒<br>`;
                    }
                );

                if (times.length === 0)
                {
                    html =
                        "無視覺反應紀錄<br>";
                }

                const average =
                    Number(
                        record.averageVisualTime ??
                        0
                    );

                return `
                    <div class="record-detail">
                        最新紀錄：${latestTime}
                        <br><br>
                        ${html}
                        <strong>
                            平均：
                            ${average.toFixed(2)}
                            秒
                        </strong>
                    </div>
                `;
            }

            if (page === "memory")
            {
                return `
                    <div class="record-detail">
                        最新紀錄：${latestTime}
                        <br><br>
                        提示次數：
                        ${record.hintCount ?? 0}
                        次
                    </div>
                `;
            }

            if (page === "hearing")
            {
                const times =
                    normalizeNumberList(
                        record.hearingTimes
                    );

                let html =
                    "";

                times.forEach(
                    function (
                        time,
                        index
                    )
                    {
                        html +=
                            `第${index + 1}通：
                            ${Number(time).toFixed(2)}
                            秒<br>`;
                    }
                );

                if (times.length === 0)
                {
                    html =
                        "無聽力反應紀錄<br>";
                }

                const average =
                    Number(
                        record.averageHearingTime ??
                        0
                    );

                return `
                    <div class="record-detail">
                        最新紀錄：${latestTime}
                        <br><br>
                        ${html}
                        <strong>
                            平均：
                            ${average.toFixed(2)}
                            秒
                        </strong>
                    </div>
                `;
            }

            const completed =
                Number(
                    record.completedCalls ??
                    0
                );

            const failed =
                Number(
                    record.failedCalls ??
                    0
                );

            const total =
                completed +
                failed;

            const rate =
                total > 0
                    ?
                    completed /
                    total *
                    100
                    :
                    0;

            return `
                <div class="record-detail">
                    最新紀錄：${latestTime}
                    <br><br>
                    成功率：${rate.toFixed(1)}%
                    <br>
                    平均視覺反應：
                    ${Number(
                        record.averageVisualTime ??
                        0
                    ).toFixed(2)}
                    秒
                    <br>
                    提示次數：
                    ${record.hintCount ?? 0}
                    次
                    <br>
                    平均聽力反應：
                    ${Number(
                        record.averageHearingTime ??
                        0
                    ).toFixed(2)}
                    秒
                </div>
            `;
        }


        /* 單人紀錄 */

        function createProfileRecordHtml(
            record,
            page
        )
        {
            const time =
                record.playedAt
                    ?
                    record.playedAt.substring(
                        11,
                        16
                    )
                    :
                    "--:--";

            if (page === "success")
            {
                const completed =
                    Number(
                        record.completedCalls ??
                        0
                    );

                const failed =
                    Number(
                        record.failedCalls ??
                        0
                    );

                const total =
                    completed +
                    failed;

                const rate =
                    total > 0
                        ?
                        completed /
                        total *
                        100
                        :
                        0;

                return `
                    <div class="record-detail">
                        遊玩時間：${time}
                        <br><br>
                        成功：${completed} 次
                        <br>
                        失敗：${failed} 次
                        <br>
                        總數：${total} 次
                        <br>
                        成功率：${rate.toFixed(1)}%
                    </div>
                `;
            }

            if (page === "visual")
            {
                const times =
                    normalizeNumberList(
                        record.visualTimes
                    );

                let timesHtml =
                    "";

                times.forEach(
                    function (
                        item,
                        index
                    )
                    {
                        timesHtml +=
                            `第${index + 1}通：
                            ${Number(item).toFixed(2)}
                            秒<br>`;
                    }
                );

                if (times.length === 0)
                {
                    timesHtml =
                        "無視覺反應紀錄<br>";
                }

                const average =
                    Number(
                        record.averageVisualTime ??
                        0
                    );

                return `
                    <div class="record-detail">
                        遊玩時間：${time}
                        <br><br>
                        ${timesHtml}
                        <strong>
                            平均：
                            ${average.toFixed(2)}
                            秒
                        </strong>
                    </div>
                `;
            }

            if (page === "memory")
            {
                return `
                    <div class="record-detail">
                        遊玩時間：${time}
                        <br><br>
                        提示次數：
                        ${record.hintCount ?? 0}
                        次
                    </div>
                `;
            }

            if (page === "hearing")
            {
                const times =
                    normalizeNumberList(
                        record.hearingTimes
                    );

                let timesHtml =
                    "";

                times.forEach(
                    function (
                        item,
                        index
                    )
                    {
                        timesHtml +=
                            `第${index + 1}通：
                            ${Number(item).toFixed(2)}
                            秒<br>`;
                    }
                );

                if (times.length === 0)
                {
                    timesHtml =
                        "無聽力反應紀錄<br>";
                }

                const average =
                    Number(
                        record.averageHearingTime ??
                        0
                    );

                return `
                    <div class="record-detail">
                        遊玩時間：${time}
                        <br><br>
                        ${timesHtml}
                        <strong>
                            平均：
                            ${average.toFixed(2)}
                            秒
                        </strong>
                    </div>
                `;
            }

            if (page === "focus")
            {
                const focus =
                    record.focusPercentage ||
                    {};

                return `
                    <div class="record-detail">
                        遊玩時間：${time}
                        <br><br>
                        1組線：
                        ${Number(
                            focus.oneLine ?? 0
                        ).toFixed(1)}%
                        <br>
                        2組線：
                        ${Number(
                            focus.twoLines ?? 0
                        ).toFixed(1)}%
                        <br>
                        3組線：
                        ${Number(
                            focus.threeLines ?? 0
                        ).toFixed(1)}%
                    </div>
                `;
            }

            const completed =
                Number(
                    record.completedCalls ??
                    0
                );

            const failed =
                Number(
                    record.failedCalls ??
                    0
                );

            const total =
                completed +
                failed;

            const rate =
                total > 0
                    ?
                    completed /
                    total *
                    100
                    :
                    0;

            return `
                <div class="record-detail">
                    遊玩時間：${time}
                    <br><br>
                    成功率：${rate.toFixed(1)}%
                    <br>
                    平均視覺反應：
                    ${Number(
                        record.averageVisualTime ??
                        0
                    ).toFixed(2)}
                    秒
                    <br>
                    提示次數：
                    ${record.hintCount ?? 0}
                    次
                    <br>
                    平均聽力反應：
                    ${Number(
                        record.averageHearingTime ??
                        0
                    ).toFixed(2)}
                    秒
                </div>
            `;
        }


        /* 更新全體 */

        async function updateAllElderCards()
        {
            for (
                const elderId
                of elderIds
            )
            {
                const dataElement =
                    document.getElementById(
                        "elderData_" +
                        elderId
                    );

                if (!dataElement)
                {
                    continue;
                }

                dataElement.innerHTML =
                    "資料讀取中...";

                const records =
                    await loadElderDailyRecords(
                        elderId
                    );

                if (records.length === 0)
                {
                    dataElement.innerHTML =
                        "當日無遊玩紀錄";

                    continue;
                }

                const latest =
                    records[
                        records.length - 1
                    ];

                dataElement.innerHTML =
                    createLatestRecordHtml(
                        latest,
                        currentGroupPage
                    );
            }
        }


        /* 日期 */

        function updateDateDisplay()
        {
            const year =
                selectedDate.getFullYear();

            const month =
                selectedDate.getMonth() +
                1;

            const day =
                selectedDate.getDate();

            currentYearText.textContent =
                year;

            currentDateText.textContent =
                month +
                "/" +
                day;

            if (
                selectedDate.getTime()
                >=
                today.getTime()
            )
            {
                nextDateButton.disabled =
                    true;

                nextDateButton.style.opacity =
                    "0.3";

                nextDateButton.style.cursor =
                    "default";
            }
            else
            {
                nextDateButton.disabled =
                    false;

                nextDateButton.style.opacity =
                    "1";

                nextDateButton.style.cursor =
                    "pointer";
            }

            if (
                !groupModeContent
                    .classList
                    .contains(
                        "hidden"
                    )
            )
            {
                updateAllElderCards();
            }

            if (
                !singleProfilePanel
                    .classList
                    .contains(
                        "hidden"
                    )
            )
            {
                updateProfileContent();
            }
        }


        previousDateButton.addEventListener(
            "click",
            function ()
            {
                selectedDate.setDate(
                    selectedDate.getDate() -
                    1
                );

                updateDateDisplay();
            }
        );


        nextDateButton.addEventListener(
            "click",
            function ()
            {
                const next =
                    new Date(
                        selectedDate
                    );

                next.setDate(
                    next.getDate() +
                    1
                );

                if (
                    next.getTime()
                    >
                    today.getTime()
                )
                {
                    return;
                }

                selectedDate =
                    next;

                updateDateDisplay();
            }
        );


        /* 全體頁籤 */

        categoryButtons.forEach(
            function (button)
            {
                button.addEventListener(
                    "click",
                    function ()
                    {
                        categoryButtons.forEach(
                            function (item)
                            {
                                item.classList.remove(
                                    "active"
                                );
                            }
                        );

                        button.classList.add(
                            "active"
                        );

                        currentGroupPage =
                            button.dataset.page;

                        pageDescription.textContent =
                            descriptions[
                                currentGroupPage
                            ];

                        updateAllElderCards();
                    }
                );
            }
        );


        /* 全體搜尋 */

        groupSearchInput.addEventListener(
            "input",
            function ()
            {
                const keyword =
                    groupSearchInput
                        .value
                        .trim();

                const cards =
                    peopleGrid.querySelectorAll(
                        ".person-card"
                    );

                cards.forEach(
                    function (card)
                    {
                        const id =
                            card.dataset.elderId;

                        if (
                            keyword ===
                            "" ||
                            id.includes(
                                keyword
                            )
                        )
                        {
                            card.style.display =
                                "";
                        }
                        else
                        {
                            card.style.display =
                                "none";
                        }
                    }
                );
            }
        );


        /* 模式 */

        modeButton.addEventListener(
            "click",
            function ()
            {
                modeDropdown.classList.toggle(
                    "show"
                );
            }
        );


        modeOptions.forEach(
            function (option)
            {
                option.addEventListener(
                    "click",
                    function ()
                    {
                        const mode =
                            option.dataset.mode;

                        if (mode === "group")
                        {
                            document.body.classList.remove(
                                "single-mode-active"
                            );

                            modeButtonText.textContent =
                                "全體模式";

                            modeSubtitle.textContent =
                                "當日遊玩數";

                            groupModeContent.classList.remove(
                                "hidden"
                            );

                            singleModeContent.classList.add(
                                "hidden"
                            );

                            updateAllElderCards();
                        }
                        else
                        {
                            document.body.classList.add(
                                "single-mode-active"
                            );

                            modeButtonText.textContent =
                                "單人模式";

                            groupModeContent.classList.add(
                                "hidden"
                            );

                            singleModeContent.classList.remove(
                                "hidden"
                            );

                            showSearchPanel();
                        }

                        modeDropdown.classList.remove(
                            "show"
                        );
                    }
                );
            }
        );


        document.addEventListener(
            "click",
            function (event)
            {
                if (
                    !event.target.closest(
                        ".mode-select"
                    )
                )
                {
                    modeDropdown.classList.remove(
                        "show"
                    );
                }
            }
        );


        /* 查詢頁 */

        function showSearchPanel()
        {
            singleSearchPanel.classList.remove(
                "hidden"
            );

            singleAddPanel.classList.add(
                "hidden"
            );

            singleProfilePanel.classList.add(
                "hidden"
            );

            modeSubtitle.textContent =
                "請查詢長輩編號";
        }


        function showAddPanel()
        {
            singleSearchPanel.classList.add(
                "hidden"
            );

            singleAddPanel.classList.remove(
                "hidden"
            );

            singleProfilePanel.classList.add(
                "hidden"
            );

            modeSubtitle.textContent =
                "請新增長輩編號";
        }


        openAddElder.addEventListener(
            "click",
            showAddPanel
        );

        backToSearch.addEventListener(
            "click",
            showSearchPanel
        );

        backToSingleSearch.addEventListener(
            "click",
            showSearchPanel
        );


        /* 新增 */

        async function addElder()
        {
            const elderId =
                newElderInput
                    .value
                    .trim();

            if (elderId === "")
            {
                alert(
                    "請輸入長輩編號"
                );

                return;
            }

            if (
                !/^\d+$/.test(
                    elderId
                )
            )
            {
                alert(
                    "長輩編號只能使用數字"
                );

                return;
            }

            try
            {
                const elderReference =
                    ref(
                        database,
                        "players/" +
                        elderId
                    );

                const snapshot =
                    await get(
                        elderReference
                    );

                if (snapshot.exists())
                {
                    alert(
                        "這個長輩編號已經存在"
                    );

                    return;
                }

                await set(
                    elderReference,
                    {
                        exists: true
                    }
                );

                if (
                    !elderIds.includes(
                        elderId
                    )
                )
                {
                    elderIds.push(
                        elderId
                    );

                    elderIds.sort(
                        function (a, b)
                        {
                            return a.localeCompare(
                                b,
                                undefined,
                                {
                                    numeric: true,
                                    sensitivity: "base"
                                }
                            );
                        }
                    );
                }

                renderElderCards();

                newElderInput.value =
                    "";

                alert(
                    "長輩編號 " +
                    elderId +
                    " 新增成功"
                );

                showSearchPanel();
            }
            catch (error)
            {
                console.error(
                    "新增長輩編號失敗：",
                    error
                );

                alert(
                    "新增失敗，請檢查 Firebase 連線或權限"
                );
            }
        }


        addElderButton.addEventListener(
            "click",
            addElder
        );


        newElderInput.addEventListener(
            "keydown",
            function (event)
            {
                if (event.key === "Enter")
                {
                    addElder();
                }
            }
        );


        /* 查詢 */

        async function searchElder()
        {
            const elderId =
                singleSearchInput
                    .value
                    .trim();

            if (elderId === "")
            {
                alert(
                    "請輸入長輩編號"
                );

                return;
            }

            try
            {
                const elderReference =
                    ref(
                        database,
                        "players/" +
                        elderId
                    );

                const snapshot =
                    await get(
                        elderReference
                    );

                if (!snapshot.exists())
                {
                    alert(
                        "查無此長輩編號"
                    );

                    return;
                }

                currentProfileElderId =
                    elderId;

                showProfilePanel(
                    elderId
                );
            }
            catch (error)
            {
                console.error(
                    "查詢長輩編號失敗：",
                    error
                );

                alert(
                    "查詢失敗，請稍後再試"
                );
            }
        }


        singleSearchButton.addEventListener(
            "click",
            searchElder
        );


        singleSearchInput.addEventListener(
            "keydown",
            function (event)
            {
                if (event.key === "Enter")
                {
                    searchElder();
                }
            }
        );


        /* 個人頁 */

        function showProfilePanel(
            elderId
        )
        {
            singleSearchPanel.classList.add(
                "hidden"
            );

            singleAddPanel.classList.add(
                "hidden"
            );

            singleProfilePanel.classList.remove(
                "hidden"
            );

            modeSubtitle.textContent =
                "編號 " +
                elderId;

            currentProfilePage =
                "success";

            profileCategoryButtons.forEach(
                function (button)
                {
                    button.classList.remove(
                        "active"
                    );

                    if (
                        button.dataset.profilePage
                        ===
                        "success"
                    )
                    {
                        button.classList.add(
                            "active"
                        );
                    }
                }
            );

            profilePageDescription.textContent =
                descriptions.success;

            updateProfileContent();
        }


        async function updateProfileContent()
        {
            if (!currentProfileElderId)
            {
                return;
            }

            profileContent.innerHTML =
                "資料讀取中...";

            const records =
                await loadElderDailyRecords(
                    currentProfileElderId
                );

            if (records.length === 0)
            {
                profileContent.innerHTML =
                    "當日無遊玩紀錄";

                return;
            }

            let html =
                "";

            records.forEach(
                function (
                    record,
                    index
                )
                {
                    html += `
                        <div class="profile-session-record">

                            <div class="profile-session-title">
                                第 ${index + 1} 局
                            </div>

                            ${createProfileRecordHtml(
                                record,
                                currentProfilePage
                            )}

                        </div>
                    `;
                }
            );

            profileContent.innerHTML =
                html;
        }


        /* 個人頁籤 */

        profileCategoryButtons.forEach(
            function (button)
            {
                button.addEventListener(
                    "click",
                    function ()
                    {
                        profileCategoryButtons.forEach(
                            function (item)
                            {
                                item.classList.remove(
                                    "active"
                                );
                            }
                        );

                        button.classList.add(
                            "active"
                        );

                        currentProfilePage =
                            button.dataset
                                .profilePage;

                        profilePageDescription.textContent =
                            descriptions[
                                currentProfilePage
                            ];

                        updateProfileContent();
                    }
                );
            }
        );


        /* 開啟刪除 */

        deleteElderButton.addEventListener(
            "click",
            function ()
            {
                if (!currentProfileElderId)
                {
                    return;
                }

                deleteModalText.textContent =
                    "是否確認刪除 " +
                    currentProfileElderId;

                deleteModal.classList.remove(
                    "hidden"
                );
            }
        );


        /* 取消刪除 */

        cancelDeleteButton.addEventListener(
            "click",
            function ()
            {
                deleteModal.classList.add(
                    "hidden"
                );
            }
        );


        /* 確認刪除 */

        confirmDeleteButton.addEventListener(
            "click",
            async function ()
            {
                if (!currentProfileElderId)
                {
                    return;
                }

                const elderIdToDelete =
                    currentProfileElderId;

                try
                {
                    await remove(
                        ref(
                            database,
                            "players/" +
                            elderIdToDelete
                        )
                    );

                    elderIds =
                        elderIds.filter(
                            function (elderId)
                            {
                                return elderId !==
                                       elderIdToDelete;
                            }
                        );

                    renderElderCards();

                    deleteModal.classList.add(
                        "hidden"
                    );

                    currentProfileElderId =
                        null;

                    singleSearchInput.value =
                        "";

                    showSearchPanel();
                }
                catch (error)
                {
                    console.error(
                        "刪除長輩編號失敗：",
                        error
                    );

                    alert(
                        "刪除失敗，請稍後再試"
                    );
                }
            }
        );


        deleteModal.addEventListener(
            "click",
            function (event)
            {
                if (
                    event.target ===
                    deleteModal
                )
                {
                    deleteModal.classList.add(
                        "hidden"
                    );
                }
            }
        );


        /* 第一次開啟 */

        async function initializeDashboard()
        {
            document.body.classList.remove(
                "single-mode-active"
            );

            await loadElderIdsFromFirebase();

            renderElderCards();

            updateDateDisplay();

            console.log(
                "Transfer Dashboard 載入完成"
            );
        }


        initializeDashboard();
    }
);