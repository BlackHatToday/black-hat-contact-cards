/* ===== EDIT THIS FILE ONLY =====
   Paste each Stripe Payment Link URL (https://buy.stripe.com/...) between the quotes.
   Leave "" blank and that button shows "Coming soon" (safe to deploy early).
   Prices shown on the pages are text only -- the real price is whatever the Stripe link says. */
window.BHC = {
  intakeForm: "https://blackhatcards.community/my-contact-info-form.html", // where buyers fill in their details (change if your form lives elsewhere)
  links: {
    cardPersonal:  "",   // Black Card - Personal
    cardBusiness:  "",   // Black Card - Business
    braceletPersonal: "", // Black Hat Bracelet ($25)
    sitePersonal:  "",   // Micro-site only - Personal  ($15)
    siteBusiness:  "",   // Micro-site only - Business  ($25)  <- price test A
    siteBusinessB: "",   // Micro-site only - Business  ($35)  <- price test B (optional; see CAMPAIGN-PLAN)
    giftNote:      ""    // optional: gift add-on
  },
  spotsLeft: { cards: "", sites: "" } // optional text e.g. "17 of 25 left" -- update by hand
};
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('[data-link]').forEach(function(a){
    var u=(window.BHC.links[a.dataset.link]||'').trim();
    if(u){a.href=u+(u.indexOf('?')>-1?'&':'?')+'client_reference_id='+encodeURIComponent(a.dataset.link)}
    else{a.classList.add('off');a.textContent='Coming soon';a.removeAttribute('href')}
  });
  document.querySelectorAll('[data-left]').forEach(function(e){
    var t=window.BHC.spotsLeft[e.dataset.left];if(t){e.textContent=t}else{e.style.display='none'}
  });
  document.querySelectorAll('[data-intake]').forEach(function(a){a.href=window.BHC.intakeForm});
});
