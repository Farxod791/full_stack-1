document.addEventListener("DOMContentLoaded", () => {
  const serviceButtons = document.querySelectorAll(".btn-page");

  serviceButtons.forEach(button => {
    button.addEventListener("click", () => {
      // Tekshiramiz foydalanuvchi login bo‘lganmi (misol uchun localStorage orqali)
      const isLoggedIn = localStorage.getItem("isLoggedIn");

      if (isLoggedIn === "true") {
        window.location.href = button.getAttribute("href");
      } else {
        alert("Iltimos, xizmatdan foydalanish uchun avval login qiling.");
        window.location.href = "login.html";
      }
    });
  });
});
document.addEventListener("submit", function (e) {
  e.preventDefault();
  const problem = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    type: document.getElementById("experience").value,
    description: document.getElementById("comments").value
  };
  localStorage.setItem("problem", JSON.stringify(problem));
  alert("Muammo masterga yuborildi!");
  window.location.href = "master.html";
});
