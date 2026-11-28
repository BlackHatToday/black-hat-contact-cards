/* ===== EDIT THIS FILE ONLY ===== (Christmas campaign copy of the Thanksgiving file)
   Paste each payment link (Square https://square.link/... or Stripe https://buy.stripe.com/...) between the quotes.
   Leave "" blank and that button shows "Coming soon" (safe to deploy early).
   Prices shown on the pages are text only -- the real price is whatever the Stripe link says. */
window.BHC = {
  intakeForm: "https://blackhatcards.community/my-contact-info-form.html", // where buyers fill in their details (change if your form lives elsewhere)
  links: {
    cardPersonal:  "https://square.link/u/IzYiB6pi",   // Black Card - Personal
    cardBusiness:  "https://square.link/u/SK0VB933",   // Black Card - Business
    braceletPersonal: "https://square.link/u/IogJ153p", // Black Hat Bracelet ($25)
    sitePersonal:  "https://square.link/u/1YwpY72P",   // Micro-site only - Personal  ($15)
    siteBusiness:  "https://square.link/u/xCQzxUan",   // Micro-site only - Business  ($25)  <- price test A
    siteBusinessB: "",   // Micro-site only - Business  ($35)  <- price test B (optional; see CAMPAIGN-PLAN)
    giftNote:      ""    // optional: gift add-on
  },
  spotsLeft: { cards: "", sites: "" } // optional text e.g. "17 of 25 left" -- update by hand
};
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('[data-link]').forEach(function(a){
    var u=(window.BHC.links[a.dataset.link]||'').trim();
    if(u){
      /* Stripe links get a tag saying which button was used. Square links are used as-is
         (Square has no such tag; each product has its own link, so sales are still distinguishable). */
      a.href=/stripe\.com/i.test(u)?u+(u.indexOf('?')>-1?'&':'?')+'client_reference_id='+encodeURIComponent(a.dataset.link):u
    }
    else{a.classList.add('off');a.textContent='Coming soon';a.removeAttribute('href')}
  });
  document.querySelectorAll('[data-left]').forEach(function(e){
    var t=window.BHC.spotsLeft[e.dataset.left];if(t){e.textContent=t}else{e.style.display='none'}
  });
  document.querySelectorAll('[data-intake]').forEach(function(a){a.href=window.BHC.intakeForm});
});
