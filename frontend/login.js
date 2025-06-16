const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");
const errorMessageSpan = errorMessage.querySelector("span");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("https://document-uploader-tbyl.onrender.com/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      window.location.href = "index.html";
    } else {
      errorMessageSpan.textContent = data.error;
      errorMessage.style.display = "flex";
      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 3000);
    }
  } catch (error) {
    errorMessageSpan.textContent = "An error occurred. Please try again.";
    errorMessage.style.display = "flex";
    setTimeout(() => {
      errorMessage.style.display = "none";
    }, 3000);
    console.error("Login error:", error);
  }
});