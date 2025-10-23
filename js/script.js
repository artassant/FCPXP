document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("participant-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const age = document.getElementById("age").value.trim();
    const gender = document.getElementById("gender").value;

    if (!name || !age || !gender) {
      alert("Please fill all fields.");
      return;
    }

    const participantInfo = { name, age, gender };
    sessionStorage.setItem("participantInfo", JSON.stringify(participantInfo));

    window.open("experiment.html", "_blank", "width=960,height=720");
  });
});
