const passwordInput = document.getElementById("passwordInput");

passwordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        login();
    }
});

function login() {
    const password = passwordInput.value;

    if (password === "0000") {
        window.location.href = "dashboard.html";
    } else {
        alert("密碼錯誤");
        passwordInput.value = "";
    }
}