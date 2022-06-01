const navBtn = document.getElementById("nav-toggle");
const links1 = document.getElementById("nav-links");
const links2 = document.getElementById("nav-links2");
// add event listener
navBtn.addEventListener("click", () => {
  links1.classList.toggle("show-links");
  links2.classList.toggle("show-user-img");
});