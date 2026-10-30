// Contact form target. Leave action empty to fall back to email.
// To connect a Google Form: set action to
// https://docs.google.com/forms/d/e/<FORM_ID>/formResponse
// and map each field to its entry.<id>.
const GOOGLE_FORM = {
  action: "",
  fields: { name: "entry.0000000001", company: "entry.0000000002", message: "entry.0000000003" },
};
const EMAIL = "hungjuei.huang@gmail.com";

const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString("en-US");

function bindOutputs(root, format) {
  root.querySelectorAll("output[data-for]").forEach((o) => {
    o.value = format(o.dataset.for, $(o.dataset.for).value);
  });
}

// Admission-note model: admissions/day × minutes saved × 365 ÷ minutes per physician-day
function notesModel() {
  const root = $("notes-model");
  const update = () => {
    const adm = +$("n-adm").value, min = +$("n-min").value, hrs = +$("n-hrs").value;
    $("n-out").textContent = fmt((adm * min * 365) / (hrs * 60));
    bindOutputs(root, (id, v) => (id === "n-hrs" ? `${v} h` : id === "n-min" ? `${v} min` : v));
  };
  root.addEventListener("input", update);
  update();
}

// Screening model: benefit captured by screening the top x of risk is 1 − (1 − x)^a,
// with a chosen so the top 20% hold the slider's share of benefit (a = 1 means no concentration).
function screenModel() {
  const root = $("screen-model");
  const POP = 72000, MAX_LY = 10000;
  const update = () => {
    const x = $("s-pct").value / 100, c = $("s-conc").value / 100;
    const a = Math.log(1 - c) / Math.log(0.8);
    const share = 1 - Math.pow(1 - x, a);
    const people = POP * x, ly = MAX_LY * share;
    $("s-people").textContent = fmt(people);
    $("s-ly").textContent = fmt(ly);
    $("s-yield").textContent = fmt((ly / people) * 1000);
    $("s-yield-all").textContent = fmt((MAX_LY / POP) * 1000);
    $("s-bar").style.width = `${share * 100}%`;
    bindOutputs(root, (_, v) => `${v}%`);
  };
  root.addEventListener("input", update);
  update();
}

// Contact form: posts to the Google Form if configured, otherwise opens an email draft.
function contactForm() {
  const form = $("contact-form"), status = $("form-status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!GOOGLE_FORM.action) {
      const body = `${data.message}\n\n${data.name}${data.company ? ", " + data.company : ""}`;
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Hello from charliehuang.com")}&body=${encodeURIComponent(body)}`;
      return;
    }
    const params = new URLSearchParams();
    for (const [k, entry] of Object.entries(GOOGLE_FORM.fields)) params.append(entry, data[k] || "");
    try {
      await fetch(GOOGLE_FORM.action, { method: "POST", mode: "no-cors", body: params });
      form.reset();
      status.textContent = "Sent. Thank you, I’ll be in touch.";
    } catch {
      status.innerHTML = `Couldn’t send. Please email <a href="mailto:${EMAIL}">${EMAIL}</a>.`;
    }
  });
}

// Easter egg: a mental-selection card trick. No first-round card appears in the second round.
function cardTrick() {
  const dialog = $("trick"), text = $("trick-text"), cards = $("trick-cards"), next = $("trick-next");
  const FIRST = ["K♠", "Q♥", "J♣", "K♦", "Q♠", "J♥"];
  const SECOND = ["Q♦", "K♣", "J♠", "Q♣", "K♥"];
  const deal = (list) => {
    cards.innerHTML = list
      .map((c) => `<span class="pc${/[♥♦]/.test(c) ? " red" : ""}">${c.slice(0, -1)}<small>${c.slice(-1)}</small></span>`)
      .join("");
  };
  const steps = [
    () => { text.textContent = "Pick one card. Don’t click it, just remember it."; deal(FIRST); next.textContent = "I’ve got it"; },
    () => { text.textContent = "Shuffling…"; cards.classList.add("shuffle"); next.hidden = true;
            setTimeout(() => { cards.classList.remove("shuffle"); next.hidden = false; step = 2; steps[2](); }, 900); },
    () => { text.textContent = "I took your card out of the deck."; deal(SECOND); next.textContent = "How?"; },
    () => { text.innerHTML = "Picking a card was the easy part. <a href=\"#contact\" id=\"trick-cta\">Let’s talk →</a>";
            cards.innerHTML = ""; next.hidden = true; },
  ];
  let step = 0;
  next.addEventListener("click", () => { step += 1; steps[step](); });
  $("motto").addEventListener("click", () => { step = 0; next.hidden = false; steps[0](); dialog.showModal(); });
  $("trick-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target.id === "trick-cta") dialog.close(); });
}

notesModel();
screenModel();
contactForm();
cardTrick();
